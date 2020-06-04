const Web3 = require('web3')
const quorumjs = require('quorum-js')

const web3 = new Web3(process.env.RPC_URL)
quorumjs.extend(web3)

const guardianAccount = '0x0Dd78c7ed1C9aAFe2bc7cD2Ec2D66201A3b771Ee'
const guardianAccountPrivateKey = '0xa9cafd151ec927864300f0ec06d88a83096b18fe13df847ef86bea73e527c3de'

const deployerAddress = '0x1cA329B2F350175b86f53721A8D5F3629173854C'
const validatorAddress = '0x633a1A98Ac9440db595f58861e8DBbB6D37130fd'
const userAddress = '0xDAFc6d3F46e210c75c0dbcA87771BFeCDb681BFc'

async function sleep(ms) {
    return new Promise(res => setTimeout(res, ms))
}

async function main() {
    //await web3.eth.personal.importRawKey(guardianAccountPrivateKey.slice(2), '')
    //await web3.eth.personal.unlockAccount(guardianAccount, '')

    const opts = {
        from: guardianAccount
    }
    await web3.quorumPermission.addSubOrg('ADMINORG', 'BRIDGEORG', '', opts)
    while ((await web3.quorumPermission.orgList()).length < 2) {
        await sleep(500)
    }
    await web3.quorumPermission.addNewRole('ADMINORG.BRIDGEORG', 'DEPLOYER', 2, false, false, opts)
    await web3.quorumPermission.addNewRole('ADMINORG.BRIDGEORG', 'VALIDATOR', 2, false, false, opts)
    await web3.quorumPermission.addNewRole('ADMINORG.BRIDGEORG', 'USER', 2, false, false, opts)
    while ((await web3.quorumPermission.roleList()).length < 4) {
        await sleep(500)
    }
    await web3.quorumPermission.addAccountToOrg(deployerAddress, 'ADMINORG.BRIDGEORG', 'DEPLOYER', opts)
    await web3.quorumPermission.addAccountToOrg(validatorAddress, 'ADMINORG.BRIDGEORG', 'VALIDATOR', opts)
    await web3.quorumPermission.addAccountToOrg(userAddress, 'ADMINORG.BRIDGEORG', 'USER', opts)
}

main()
