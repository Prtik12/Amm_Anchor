import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorAmm } from "../target/types/anchor_amm";
import { PublicKey, Commitment, Keypair, SystemProgram, Connection} from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID as associatedTokenProgram, TOKEN_PROGRAM_ID as tokenProgram, createMint, createAccount, mintTo, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from "@solana/spl-token"
import { randomBytes } from "crypto"
import { assert } from "chai";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { min } from "bn.js";

const commitment: Commitment = "confirmed";

describe("anchor-amm", () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.anchorAmm as Program<AnchorAmm>;

  const provider = anchor.getProvider();

  const connection = provider.connection;

  const [admin, user] = [new Keypair(), new Keypair()];

  const seed = new BN(randomBytes(8));
  const fee = 30;
  const DECIMALS = 6;

  const config = PublicKey.findProgramAddressSync([Buffer.from("config"), seed.toArrayLike(Buffer, "le", 8)], program.programId)[0];

  //mint
  let mint_x: PublicKey;
  let mint_y: PublicKey;
  let mint_lp = PublicKey.findProgramAddressSync(
    [Buffer.from("lp"), config.toBuffer()],
    program.programId
  )[0]; 

  //vault
  let vault_x: PublicKey;
  let vault_y: PublicKey;

  //user
  let user_x: PublicKey;
  let user_y: PublicKey;
  let user_lp: PublicKey;

  before("Airdrop and create Mints", async () => {

    await Promise.all([admin, user].map(async (k) => {
    return await anchor.getProvider().connection.requestAirdrop(k.publicKey, 100 * anchor.web3.LAMPORTS_PER_SOL)

  })).then(confirmTxs);

  mint_x = await createMint(
    connection,
    admin,
    admin.publicKey,
    admin.publicKey,
    DECIMALS
  )

  mint_y = await createMint(
    connection,
    admin,
    admin.publicKey,
    admin.publicKey,
    DECIMALS
  )

  vault_x = await getAssociatedTokenAddress(
    mint_x,
    config,
    true
  )

  vault_y = await getAssociatedTokenAddress(
    mint_y,
    config,
    true
  )

  user_x = (await getAssociatedTokenAddress(
    connection,
    user,
    mint_x,
    user.publicKey,
    true
  )).address

  user_y = (await getAssociatedTokenAddress(
    connection,
    user,
    mint_y,
    user.publicKey,
    true
  )).address

  try{
    const mintX = await mintTo(
      connection,
      admin,
      mint_x,
      user_x,
      admin.publicKey,
      1000 * DECIMALS
    )

    console.log("mintx", mintX)
  }catch(e){
    console.log("error while mint x", e);
  }

  const mintY = await mintTo(
    connection,
    admin,
    mint_y,
    user_y,
    admin.publicKey,
    1000 * DECIMALS
  )
  console.log("minty", mintY)
})

let listenerIds: number[]  = [];
before(() => {
  const initializeListener = program.addEventListener("initializeEvent", (event, slot, signature) => {
    console.log("Initialize Event :", event, "Slot :", slot, "Signature :", signature);
  });

  listenerIds.push(initializeListener);

  const depositListener = program.addEventListener("depositEvent", (event, slot, signature) => {
    console.log("Deposit Event :", event, "Slot :", slot, "Signature :", signature);
  });

  listenerIds.push(depositListener);

  const swapListener = program.addEventListener("swapEvent", (event, slot, signature) => {
    console.log("Swap Event :", event, "Slot :", slot, "Signature :", signature);
  });
  listenerIds.push(swapListener);

  const lockListener = program.addEventListener("lockEvent", (event, slot, signature) => {
    console.log("Lock Event :", event, "Slot :", slot, "Signature :", signature);
  });
  listenerIds.push(lockListener);

  const unlockListener = program.addEventListener("unlockEvent", (event, slot, signature) => {
    console.log("Unlock Event :", event, "Slot :", slot, "Signature :", signature);
  });
  listenerIds.push(unlockListener);

  const withdrawListener = program.addEventListener("withdrawEvent", (event, slot, signature) => {
    console.log("Withdraw Event :", event, "Slot :", slot, "Signature :", signature);
  });
  listenerIds.push(withdrawListener);

})

  it("Is initialized!", async () => {

    const tx = await program.methods.initialize(
      seed,
      fee,
      admin.publicKey,
    )
    .accountsStrict({
      admin: admin.publicKey,
      mintX: mint_x,
      mintY: mint_y,
      mintLp: mint_lp,
      vaultX: vault_x,
      vaultY: vault_y,
      config: config,
      tokenProgram,
      associatedTokenProgram,
      systemProgram: SystemProgram.programId,
    })
    .signers([admin])
    .rpc()
    console.log("Your transaction signature", tx);
  });

  it("Lock Pool", async () => {
    const tx = await program.methods.lock().accountsStrict({
      user: user.publicKey,
      config: config,
    })
    .signers([user])
    .rpc()
  })

  it("Unlock Pool", async () => {
    const tx = await program.methods.unlock().accountsStrict({
      user: user.publicKey,
      config: config,
    })
    .signers([user])
    .rpc()
  })

  it("Swap X for Y", async () => {
    const tx = await program.methods.swap(
      true,
      new BN(10),
      new BN(6)


});
