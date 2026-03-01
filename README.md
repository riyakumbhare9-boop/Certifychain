# 🔗 CertifyChain – Decentralized Product Authentication System

CertifyChain is a blockchain-based decentralized application (DApp) that helps detect counterfeit products using smart contracts and QR-based tracking.

It enables transparent product lifecycle tracking from Manufacturer → Seller → Consumer using Ethereum blockchain.

---

## 🚀 Features

- ✅ Manufacturer can register products
- ✅ QR code generation for product verification
- ✅ Manufacturer can sell products to sellers
- ✅ Sellers can sell products to consumers
- ✅ Consumers can verify product authenticity
- ✅ Blockchain-based immutable transaction history
- ✅ MetaMask wallet integration
- ✅ Ganache local blockchain support

---

## 🏗 System Architecture

Roles in the system:

- 🏭 Manufacturer  
- 🏪 Seller  
- 👤 Consumer  

Each transaction is recorded on-chain using Solidity smart contracts.

---

## 🛠 Tech Stack

- **Solidity** – Smart Contracts  
- **Truffle** – Smart Contract Deployment  
- **Ganache** – Local Ethereum Blockchain  
- **Web3.js** – Blockchain Interaction  
- **MetaMask** – Wallet Integration  
- **HTML, CSS, Bootstrap** – Frontend  
- **JavaScript** – DApp Logic  

---

## 📦 Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/riyakumbhare9-boop/Certifychain.git
cd Certifychain
```

---

### 2️⃣ Install dependencies

```bash
npm install
```

---

### 3️⃣ Start Ganache

- Open Ganache
- Ensure RPC URL is:
  ```
  http://127.0.0.1:7545
  ```
- Note the Chain ID

---

### 4️⃣ Deploy Smart Contracts

```bash
truffle migrate --reset
```

---

### 5️⃣ Run the DApp

Open the frontend in browser (usually from `src/index.html`).

Make sure:

- MetaMask is installed
- MetaMask is connected to Ganache network
- Correct account is selected

---

## 🔐 How It Works

1. Manufacturer adds product details.
2. QR code is generated for the product.
3. Manufacturer transfers product to seller.
4. Seller transfers product to consumer.
5. Consumer verifies product authenticity.
6. All transactions are stored permanently on blockchain.

---

## 📸 Future Improvements

- Role-based dashboard
- UI redesign with modern framework
- IPFS-based document storage
- Event logging with transaction hash display
- Wallet-based identity filtering

---


## 📄 License

This project is for educational and demonstration purposes.
