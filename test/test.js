const Web3 = require('web3')
const {
    HOME_RPC_URL,
    FOREIGN_RPC_URL,
    HOME_AMB_BRIDGE,
    FOREIGN_AMB_BRIDGE,
    DEPLOYMENT_ACCOUNT_PRIVATE_KEY,
    PRIVATE_KEY,
    ERC20_TOKEN_ADDRESS,
    HOME_MEDIATOR_ADDRESS,
    FOREIGN_MEDIATOR_ADDRESS
} = process.env

const web3Home = new Web3(HOME_RPC_URL)
const web3Foreign = new Web3(FOREIGN_RPC_URL)
const owner = web3Foreign.eth.accounts.wallet.add(DEPLOYMENT_ACCOUNT_PRIVATE_KEY)
const { address } = web3Home.eth.accounts.wallet.add(PRIVATE_KEY)
web3Foreign.eth.accounts.wallet.add(PRIVATE_KEY)
const Box = require('./Box')
const Token = require('./ERC20')
const ForeignMediator = require('./ForeignMediator')

async function delay(ms) {
    return new Promise(res => setTimeout(res, ms))
}

let homeNonce
let foreignNonce
async function mintBlock() {
    await web3Foreign.eth.sendTransaction({
        from: address,
        to: address,
        value: 1,
        gas: 21000,
        nonce: foreignNonce++
    })
}

describe('test pair of box contracts', async () => {
    let homeBox, foreignBox

    before(async () => {
        homeNonce = await web3Home.eth.getTransactionCount(address)
        foreignNonce = await web3Foreign.eth.getTransactionCount(address)
        homeBox = await new web3Home.eth.Contract(Box.abi).deploy({
            data: Box.bytecode
        }).send({
            from: address,
            gasPrice: 0,
            gas: 1000000,
            nonce: homeNonce++
        })
        foreignBox = await new web3Foreign.eth.Contract(Box.abi).deploy({
            data: Box.bytecode
        }).send({
            from: address,
            gas: 1000000,
            nonce: foreignNonce++
        })
    })

    it('home -> foreign', async () => {
        await homeBox.methods
            .setValueOnOtherNetwork(5, HOME_AMB_BRIDGE, foreignBox.options.address)
            .send({
                from: address,
                gas: 1000000,
                gasPrice: 0,
                nonce: homeNonce++
            })

        while ((await foreignBox.methods.value().call()).toString(10) != '5') {
            await mintBlock()
            await delay(1000)
        }
    })

    it('foreign -> home', async () => {
        await foreignBox.methods
            .setValueOnOtherNetwork(7, FOREIGN_AMB_BRIDGE, homeBox.options.address)
            .send({
                gas: 1000000,
                from: address,
                nonce: foreignNonce++
            })

        while ((await homeBox.methods.value().call()).toString(10) != '7') {
            await mintBlock()
            await delay(1000)
        }
    })
})

describe('test pair of mediator contracts', async () => {
    let homeBridge, foreignBridge, token

    before(async () => {
        const ownerNonce = await web3Foreign.eth.getTransactionCount(owner.address)
        token = await new web3Foreign.eth.Contract(Token.abi, ERC20_TOKEN_ADDRESS)
        foreignBridge = await new web3Foreign.eth.Contract(ForeignMediator.abi, FOREIGN_MEDIATOR_ADDRESS)
        await token.methods.transfer(address, '100000000000000000000').send({
            gas: 1000000,
            from: owner.address,
            nonce: ownerNonce
        })
        await mintBlock()
    })

    it('foreign -> home', async () => {
        await token.methods.transfer(FOREIGN_MEDIATOR_ADDRESS, '1000000000000000000').send({
            gas: 1000000,
            from: address,
            nonce: foreignNonce++
        })

        // 0 eth + 1 eth * 99% = 0.99 eth
        while (await web3Home.eth.getBalance(address) != '990000000000000000') {
            await mintBlock()
            await delay(1000)
        }
    })

    it('home -> foreign', async () => {
        await web3Home.eth.sendTransaction({
            from: address,
            to: HOME_MEDIATOR_ADDRESS,
            value: '500000000000000000',
            gas: 1000000,
            nonce: homeNonce++
        })

        // 99 eth + 0.5 eth * 98% = 99.49 eth
        while ((await token.methods.balanceOf(address).call()).toString(10) != '99490000000000000000') {
            await mintBlock()
            await delay(1000)
        }
    })
})