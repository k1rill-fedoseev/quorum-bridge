const Web3 = require('web3')
const {
    COMMON_HOME_RPC_URL,
    COMMON_FOREIGN_RPC_URL,
    COMMON_HOME_BRIDGE_ADDRESS,
    COMMON_FOREIGN_BRIDGE_ADDRESS,
    PRIVATE_KEY
} = process.env

const web3Home = new Web3(COMMON_HOME_RPC_URL)
const web3Foreign = new Web3(COMMON_FOREIGN_RPC_URL)
const { address } = web3Home.eth.accounts.wallet.add(PRIVATE_KEY)
web3Foreign.eth.accounts.wallet.add(PRIVATE_KEY)
const { abi, bytecode } = require('./Box')

async function delay(ms) {
    return new Promise(res => setTimeout(res, ms))
}

async function mintBlock() {
    await web3Home.eth.sendTransaction({
        from: address,
        to: address,
        value: 1,
        gas: 21000
    })

    await web3Foreign.eth.sendTransaction({
        from: address,
        to: address,
        value: 1,
        gas: 21000
    })
}

describe('test pair of box contracts', async () => {
    let homeBox, foreignBox

    before(async () => {
        const tx1 = await web3Home.eth.sendTransaction({
            from: address,
            data: bytecode,
            gasPrice: 0,
            gas: 1000000
        })
        homeBox = new web3Home.eth.Contract(abi, tx1.contractAddress)
        const tx2 = await web3Foreign.eth.sendTransaction({
            from: address,
            data: bytecode,
            gas: 1000000
        })
        foreignBox = new web3Foreign.eth.Contract(abi, tx2.contractAddress)
    })

    it('home -> foreign', async () => {
        await homeBox.methods
            .setValueOnOtherNetwork(5, COMMON_HOME_BRIDGE_ADDRESS, foreignBox.options.address)
            .send({
                from: address,
                gas: 100000,
                gasPrice: 0
            })

        while ((await foreignBox.methods.value().call()).toString(10) != '5') {
            await mintBlock()
            await delay(1000)
        }
    })

    it('foreign -> home', async () => {
        await foreignBox.methods
            .setValueOnOtherNetwork(7, COMMON_FOREIGN_BRIDGE_ADDRESS, homeBox.options.address)
            .send({
                gas: 100000,
                from: address
            })

        while ((await homeBox.methods.value().call()).toString(10) != '7') {
            await mintBlock()
            await delay(1000)
        }
    })
})
