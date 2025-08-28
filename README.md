# Anchor AMM on Solana

A fully decentralized **Automated Market Maker (AMM)** built on the Solana blockchain using the **Anchor** framework. This project provides a foundational constant-product AMM, allowing users to create liquidity pools, swap tokens, and earn fees.

---

## Project Overview

<img width="1343" height="806" alt="Screenshot 2025-08-28 at 6 02 06 PM" src="https://github.com/user-attachments/assets/c7385b4c-cf00-4db9-8223-0a33027666d5" />

This AMM is a **smart contract** (or "program" in Solana) that enables permissionless token swaps. It uses the **constant product formula** `x * y = k` to determine token prices based on the liquidity available in the pool.  

The program is written in **Rust** with **Anchor**, and it comes with a comprehensive **TypeScript test suite** to ensure correctness and reliability.

---

## Features

- **Initialize Pool:** Create a new trading pair and liquidity pool.  
- **Deposit Liquidity:** Add tokens to a pool to become a liquidity provider and earn fees.  
- **Swap Tokens:** Exchange one token for another based on the pool's price.  
- **Withdraw Liquidity:** Remove your tokens from the pool and collect your share of accrued trading fees.  
- **Admin Controls:** A designated authority can temporarily lock the pool from deposits, swaps, and withdrawals.  

---

## Tech Stack

- **Blockchain:** Solana  
- **Smart Contracts:** Rust & Anchor Framework  
- **Testing:** TypeScript, Mocha, Chai  
- **Client Interaction:** `@solana/web3.js`, `@solana/spl-token`  

---

## Prerequisites

Before you begin, ensure you have the following installed:

- Rust  
- Solana Tool Suite  
- Anchor Framework (v0.29.0 or higher recommended)  
- Node.js (v18 or higher recommended)  
- Yarn  

---

## Getting Started

Follow these steps to get the project running locally:

### 1. Clone the Repository

```bash
git clone https://github.com/Prtik12/Amm_Anchor.git
cd anchor-amm
````

### 2. Install Dependencies

```bash
yarn install
```

### 3. Build the On-Chain Program

Compile the Rust program to BPF bytecode:

```bash
anchor build
```

This command will also generate the program's **IDL (Interface Definition Language)** in the `target/` directory, which is essential for the client and tests to communicate with the on-chain program.

---

## Running the Tests

To verify that the program is working correctly, run the complete test suite:

```bash
anchor test
```

This will start a local Solana validator, deploy the program, and execute all the test cases defined in the `tests/` directory.

You should see output indicating that all tests have passed.

---

## Program Instructions

| Instruction  | Description                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------- |
| `initialize` | Creates a new AMM pool with a specific seed, fee, and authority. Initializes the token vaults.      |
| `deposit`    | Allows a user to deposit a pair of tokens (X and Y) into the pool and receive LP tokens in return.  |
| `swap`       | Allows a user to swap a certain amount of one token for another.                                    |
| `withdraw`   | Allows a user to burn their LP tokens to withdraw their proportional share of tokens from the pool. |
| `lock`       | Admin-only function to pause all trading, depositing, and withdrawing activities.                   |
| `unlock`     | Admin-only function to resume all activities in the pool.                                           |

