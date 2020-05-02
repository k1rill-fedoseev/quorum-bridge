const ethers = require('ethers')
const {
    COMMON_HOME_RPC_URL,
    COMMON_FOREIGN_RPC_URL,
    COMMON_HOME_BRIDGE_ADDRESS,
    COMMON_FOREIGN_BRIDGE_ADDRESS,
    PRIVATE_KEY
} = process.env

const homeProvider = new ethers.providers.JsonRpcProvider(COMMON_HOME_RPC_URL)
const foreignProvider = new ethers.providers.JsonRpcProvider(COMMON_FOREIGN_RPC_URL)
const homeWallet = new ethers.Wallet(PRIVATE_KEY, homeProvider)
const foreignWallet = new ethers.Wallet(PRIVATE_KEY, foreignProvider)
const { abi, bytecode } = require('./Box')

async function delay(ms) {
    return new Promise(res => setTimeout(res, ms))
}

async function mintBlock() {
    await homeWallet.sendTransaction({
        to: homeWallet.address,
        value: 1
    })

    await foreignWallet.sendTransaction({
        to: foreignWallet.address,
        value: 1
    })
}

describe('test pair of box contracts', async () => {
    let homeBox, foreignBox

    before(async () => {
        const tx1 = await homeWallet.sendTransaction({
            data: bytecode,
            gasPrice: 0
        })
        const receipt1 = await tx1.wait()
        homeBox = new ethers.Contract(receipt1.contractAddress, abi, homeWallet)
        const tx2 = await foreignWallet.sendTransaction({
            data: bytecode
        })
        const receipt2 = await tx2.wait()
        foreignBox = new ethers.Contract(receipt2.contractAddress, abi, foreignWallet)
    })

    it('home -> foreign', async () => {
        await homeBox.setValueOnOtherNetwork(5, COMMON_FOREIGN_BRIDGE_ADDRESS, foreignBox.address)

        while ((await foreignBox.value()).toString(10) != '5') {
            await mintBlock()
            await delay(1000)
        }
    })

    it('foreign -> home', async () => {
        await foreignBox.setValueOnOtherNetwork(7, COMMON_HOME_BRIDGE_ADDRESS, homeBox.address)

        while ((await homeBox.value()).toString(10) != '7') {
            await mintBlock()
            await delay(1000)
        }
    })
})
