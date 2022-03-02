const hre = require("hardhat");
const Library = require('../artifacts/contracts/Library.sol/Library.json')


const run = async function() {
    const provider = new hre.ethers.providers.JsonRpcProvider("http://localhost:8545")
	const latestBlock = await provider.getBlock("latest")
	console.log(latestBlock.hash)

    const wallet = new hre.ethers.Wallet("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", provider);
	const balance = await wallet.getBalance()
	console.log(hre.ethers.utils.formatEther(balance, 18))

    const libraryContract = new hre.ethers.Contract("0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", Library.abi, wallet)
    await libraryContract.addBook("Test title", 2)
	console.log(await libraryContract.getAvailableBooks())
}

run()