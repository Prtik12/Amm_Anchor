import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { AmmAnchor } from "../target/types/amm_anchor";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID as associatedTokenProgram,
  TOKEN_PROGRAM_ID as tokenProgram,
  createMint,
  mintTo,
  getOrCreateAssociatedTokenAccount,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { assert } from "chai";

describe("AMM Tests", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.AmmAnchor as Program<AmmAnchor>;
  const connection = provider.connection;

  // Keypairs
  const admin = Keypair.generate();
  const user = Keypair.generate();

  // Constants
  const DECIMALS = 6;
  const fee = 300; // 3% fee
  // Use a fixed seed for predictable addresses and test runs
  const seed = new BN(1234);

  // PDAs
  const [config] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("config"),
      seed.toArrayLike(Buffer, "le", 8), // ✅ CORRECTED: Removed admin.publicKey from seeds
    ],
    program.programId
  );

  const [mint_lp] = PublicKey.findProgramAddressSync(
    [Buffer.from("lp"), config.toBuffer()],
    program.programId
  );

  // Account Public Keys
  let mint_x: PublicKey;
  let mint_y: PublicKey;
  let vault_x: PublicKey;
  let vault_y: PublicKey;
  let user_x: PublicKey;
  let user_y: PublicKey;
  let user_lp: PublicKey;

  before("Setup environment", async () => {
    // Request airdrops for admin and user
    const adminAirdropSig = await provider.connection.requestAirdrop(admin.publicKey, 10 * LAMPORTS_PER_SOL);
    const userAirdropSig = await provider.connection.requestAirdrop(user.publicKey, 10 * LAMPORTS_PER_SOL);
  
    // ✅ ADDED: Wait for airdrops to be confirmed
    const latestBlockhash = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      signature: adminAirdropSig,
    });
    await connection.confirmTransaction({
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      signature: userAirdropSig,
    });
  
    // Create token mints
    mint_x = await createMint(connection, admin, admin.publicKey, null, DECIMALS);
    mint_y = await createMint(connection, admin, admin.publicKey, null, DECIMALS);
  
    // Get vault addresses (ATAs owned by the 'config' PDA)
    vault_x = getAssociatedTokenAddressSync(mint_x, config, true);
    vault_y = getAssociatedTokenAddressSync(mint_y, config, true);
  
    // Create user's token accounts
    user_x = (await getOrCreateAssociatedTokenAccount(connection, user, mint_x, user.publicKey)).address;
    user_y = (await getOrCreateAssociatedTokenAccount(connection, user, mint_y, user.publicKey)).address;
  
    // Mint initial tokens to the user
    await mintTo(connection, admin, mint_x, user_x, admin, 1000 * 10 ** DECIMALS);
    await mintTo(connection, admin, mint_y, user_y, admin, 1000 * 10 ** DECIMALS);
  });

  it("Initialize pool", async () => {
    await program.methods
      .initialize(seed, fee, admin.publicKey)
      .accountsStrict({
        admin: admin.publicKey,
        mintX: mint_x,
        mintY: mint_y,
        lpMint: mint_lp,
        vaultX: vault_x,
        vaultY: vault_y,
        config: config,
        tokenProgram,
        associatedTokenProgram,
        systemProgram: SystemProgram.programId,
      })
      .signers([admin])
      .rpc();

    const configAccount = await program.account.config.fetch(config);
    assert.ok(configAccount.authority.equals(admin.publicKey));
    assert.equal(configAccount.fee, fee);
    assert.equal(configAccount.locked, false);
  });

  it("Deposit liquidity", async () => {
    // Create the user's LP token account now that the LP mint is initialized
    user_lp = (await getOrCreateAssociatedTokenAccount(connection, user, mint_lp, user.publicKey)).address;

    const depositAmount = new BN(100 * 10 ** DECIMALS);
    const maxX = new BN(50 * 10 ** DECIMALS);
    const maxY = new BN(50 * 10 ** DECIMALS);

    await program.methods
      .deposit(depositAmount, maxX, maxY)
      .accountsStrict({
        user: user.publicKey,
        mintX: mint_x,
        mintY: mint_y,
        config: config,
        mintLp: mint_lp,
        vaultX: vault_x,
        vaultY: vault_y,
        userX: user_x,
        userY: user_y,
        userLp: user_lp,
        tokenProgram,
        associatedTokenProgram,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const userLpBalance = await connection.getTokenAccountBalance(user_lp);
    assert.equal(userLpBalance.value.amount, depositAmount.toString());
  });

  it("Swap X for Y", async () => {
    const swapAmount = new BN(5 * 10 ** DECIMALS);
    const minOut = new BN(1); // Minimum amount doesn't need to be scaled

    const userYBefore = await connection.getTokenAccountBalance(user_y);

    await program.methods
      .swap(true, swapAmount, minOut) // is_x = true
      .accountsStrict({
        user: user.publicKey,
        mintX: mint_x,
        mintY: mint_y,
        config: config,
        mintLp: mint_lp,
        vaultX: vault_x,
        vaultY: vault_y,
        userX: user_x,
        userY: user_y,
        tokenProgram,
        associatedTokenProgram,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const userYAfter = await connection.getTokenAccountBalance(user_y);
    assert.ok(BigInt(userYAfter.value.amount) > BigInt(userYBefore.value.amount));
  });

  it("Lock and unlock pool", async () => {
    // Lock the pool
    await program.methods
      .lock()
      .accountsStrict({
        user: admin.publicKey,
        config: config,
      })
      .signers([admin])
      .rpc();

    let configAccount = await program.account.config.fetch(config);
    assert.equal(configAccount.locked, true);

    // Unlock the pool
    await program.methods
      .unlock()
      .accountsStrict({
        user: admin.publicKey,
        config: config,
      })
      .signers([admin])
      .rpc();

    configAccount = await program.account.config.fetch(config);
    assert.equal(configAccount.locked, false);
  });

  it("Withdraw liquidity", async () => {
    const userLpBefore = await connection.getTokenAccountBalance(user_lp);
    const userXBefore = await connection.getTokenAccountBalance(user_x);
    const userYBefore = await connection.getTokenAccountBalance(user_y);
    
    // Withdraw half of the LP tokens
    const withdrawAmount = new BN(userLpBefore.value.amount).div(new BN(2));
    const minX = new BN(1);
    const minY = new BN(1);

    await program.methods
      .withdraw(withdrawAmount, minX, minY)
      .accountsStrict({
        user: user.publicKey,
        mintX: mint_x,
        mintY: mint_y,
        config: config,
        mintLp: mint_lp,
        vaultX: vault_x,
        vaultY: vault_y,
        userX: user_x,
        userY: user_y,
        userLp: user_lp,
        tokenProgram,
        associatedTokenProgram,
        systemProgram: SystemProgram.programId,
      })
      .signers([user])
      .rpc();

    const userLpAfter = await connection.getTokenAccountBalance(user_lp);
    const userXAfter = await connection.getTokenAccountBalance(user_x);
    const userYAfter = await connection.getTokenAccountBalance(user_y);

    assert.ok(BigInt(userLpAfter.value.amount) < BigInt(userLpBefore.value.amount));
    assert.ok(BigInt(userXAfter.value.amount) > BigInt(userXBefore.value.amount));
    assert.ok(BigInt(userYAfter.value.amount) > BigInt(userYBefore.value.amount));
  });
});