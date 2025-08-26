import * as anchor from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { AnchorAmm } from "../target/types/anchor_amm";
import { PublicKey, Commitment, Keypair, SystemProgram, Connection} from "@solana/web3.js";
import { ASSOCIATED_TOKEN_PROGRAM_ID as associatedTokenProgram, TOKEN_PROGRAM_ID as tokenProgram, createMint, createAccount, mintTo, getAssociatedTokenAddress, TOKEN_PROGRAM_ID, getOrCreateAssociatedTokenAccount } from "@solana/spl-token"
import { randomBytes } from "crypto"
import { assert } from "chai";
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";

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

  it("Is initialized!", async () => {
    // Add your test here.
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
