const fs = require('fs')

const Web3 = require('web3')

const web3 = new Web3(process.env.RPC_URL)

async function deploy(contractName) {
    const bin = fs.readFileSync(`./permissions/compiled/${contractName}.bin`).toString()
    const abi = JSON.parse(fs.readFileSync(`./permissions/compiled/${contractName}.abi`))
    const contract = new web3.eth.Contract(abi)
    const sender = (await web3.eth.getAccounts())[0]
    const deployed = await contract.deploy({
        data: `0x${bin}`,
        arguments: [].slice.call(arguments, 1)
    }).send({
        from: sender,
        gas: 30000000,
        gasPrice: 0
    })
    return deployed
}

const guardianAccount = '0x0Dd78c7ed1C9aAFe2bc7cD2Ec2D66201A3b771Ee'
const guardianAccountPrivateKey = '0xa9cafd151ec927864300f0ec06d88a83096b18fe13df847ef86bea73e527c3de'
async function main() {
    const permissionsUpgradable = await deploy('PermissionsUpgradable', guardianAccount)
    const permissionsInterface = await deploy('PermissionsInterface', permissionsUpgradable.options.address)
    const accountManager = await deploy('AccountManager', permissionsUpgradable.options.address)
    const nodeManager = await deploy('NodeManager', permissionsUpgradable.options.address)
    const orgManager = await deploy('OrgManager', permissionsUpgradable.options.address)
    const roleManager = await deploy('RoleManager', permissionsUpgradable.options.address)
    const voterManager = await deploy('VoterManager', permissionsUpgradable.options.address)
    const permissionsImplementation = await deploy(
        'PermissionsImplementation',
        permissionsUpgradable.options.address,
        orgManager.options.address,
        roleManager.options.address,
        accountManager.options.address,
        voterManager.options.address,
        nodeManager.options.address
    )

    web3.eth.accounts.wallet.add(guardianAccountPrivateKey)
    await permissionsUpgradable.methods.init(
        permissionsInterface.options.address,
        permissionsImplementation.options.address
    ).send({
        from: guardianAccount,
        gas: 4500000,
        gasPrice: 0
    })
    fs.writeFileSync("./permissions/permission-config.json", JSON.stringify({
        upgradableAddress: permissionsUpgradable.options.address,
        interfaceAddress: permissionsInterface.options.address,
        accountMgrAddress: accountManager.options.address,
        nodeMgrAddress: nodeManager.options.address,
        orgMgrAddress: orgManager.options.address,
        roleMgrAddress: roleManager.options.address,
        voterMgrAddress: voterManager.options.address,
        implAddress: permissionsImplementation.options.address,
        nwAdminOrg: 'ADMINORG',
        nwAdminRole: 'ADMIN',
        orgAdminRole: 'ORGADMIN',
        accounts: [guardianAccount],
        subOrgBreadth: 3,
        subOrgDepth: 4
    }))
}

main()
