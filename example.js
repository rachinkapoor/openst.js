// To use this example, please setup local dev environment using. You can use the following command.
// npm run init-dev-env

const OpenST = require('./index.js');
const os = require('os');

// Step #1: Define the web3Provider for OpenSt Framework.
let web3Provider = 'http://127.0.0.1:8545';

// [OPTIONAL] This is a optional code which depends upon init-dev-env script.
let configFilePath = os.homedir() + '/openst-setup/config.json';
let devEnvConfig = require(configFilePath);
let deployerAddress = devEnvConfig.deployerAddress;
let organizationAddress = devEnvConfig.organizationAddress;
let wallet1 = devEnvConfig.wallet1;
let wallet2 = devEnvConfig.wallet2;
let ephemeralKey = devEnvConfig.ephemeralKey1;
let facilitatorAddress = devEnvConfig.facilitator;
let gasPrice = '0x12A05F200';
let gasLimit = 4700000;

// Step #2: Create configurations for OpenSt framework.
let openStOptions = {
  deployer: devEnvConfig.deployerAddress,
  facilitator: devEnvConfig.facilitator,
  organization: devEnvConfig.organizationAddress,
  gasPrice: gasPrice,
  gasLimit: gasLimit
};

// Step #3: Create an instance of OpenST.
let openST = new OpenST(web3Provider, openStOptions);
let web3 = openST.web3();

// Lets declare few variables that we shall use later in the script.
let tokenEconomy,
  tokenRulesAddress,
  tokenRules,
  token,
  tokenHolders = [];

// Step #4: [OPTIONAL/RECOMMENDED] Set openSt signer service.

// OpenST.js makes it easy for developers to build custom and secure key-management solutions.
// Thats right! You can build your own custom signer service.
// Once the signer service is set, you can use:
// Contract.methods.myMethod.send (https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html#methods-mymethod-send)
// and web3.eth.sendTransaction (https://web3js.readthedocs.io/en/1.0/web3-eth.html#sendtransaction)
// without worrying about unlocking/signing the transactions.

// To build your own custom signer service, please refer CustomSignerService.md
// For development purpose, you can use OpenST.utils.GethSignerService.
let passphrase = 'testtest';
let gethSigner = new OpenST.utils.GethSignerService(web3Provider);
gethSigner.addAccount(deployerAddress, passphrase);
gethSigner.addAccount(organizationAddress, passphrase);
gethSigner.addAccount(wallet1, passphrase);
gethSigner.addAccount(wallet2, passphrase);
gethSigner.addAccount(ephemeralKey, passphrase);
gethSigner.addAccount(facilitatorAddress, passphrase);
openST.signers.setSignerService(gethSigner);

// Step #5: Create and deploy token economy or use an existing one.
async function createTokenEconomy() {
  // Set tokenRulesAddress address here if you want to use existing economy.
  tokenRulesAddress = '0x946E50e21a6C0006783BBd12C619D267895288b3';

  return new Promise(function(resolve, reject) {
    if (tokenRulesAddress) {
      tokenEconomy = new openST.TokenEconomy(tokenRulesAddress);
    } else {
      //TBD
    }

    //Wait for tokenEconomy to be ready.
    tokenEconomy
      .on('ready', async function() {
        console.log('tokenEconomy object is ready for use.');
        tokenRules = tokenEconomy.tokenRules;
        token = tokenEconomy.token;
        resolve(tokenEconomy);
      })
      .on('error', function(error) {
        console.log('Failed to initialise TokenEconomy. error ', error);
        reject(error);
      });
  });
}

//Step #6: Lets create few token holders that shall participate in economy.
//Please make sure wallet1 & wallet2 addresses are available.
async function createTokenHolders(numberOfTokenHolders) {
  while (numberOfTokenHolders--) {
    let tokenHolder = await tokenEconomy.createTokenHolder(wallet1, wallet2);
    console.log('tokenHolder created. address:', tokenHolder.address());
    tokenHolders.push(tokenHolder);
  }
  return tokenHolders;
}

// Step #7: Lets distirbute some tokens to tokenHolders to get the economy moving.
async function fundTokenHolders(_from, amount) {
  let len = tokenHolders.length;
  while (len--) {
    let tokenHolder = tokenHolders[len];
    let contractAddress = tokenHolder.address();

    await tokenEconomy.token
      .transfer(contractAddress, amount)
      .send({
        from: _from,
        gasPrice: '0x12A05F200',
        gas: 60000
      })
      .on('receipt', function(receipt) {
        console.log(contractAddress, 'has received', amount, 'BTs');
        console.log('receipt', receipt);
      });
  }
}

// Step #8: Lets authorize session for an ephemeral key.
let authorizeSession = async function(tokenHolder, ephemeralKey, wallets) {
  const BigNumber = require('bignumber.js');
  const web3 = openST.web3();

  //Deterime what should be spending limit of ephemeral-key per transaction.
  let spendingLimit = web3.utils.toWei('5');

  //Deterime the expirationHeight (How long is this ephemeral-key is allowed to spend).
  let currentBlockNumber = await web3.eth.getBlockNumber();
  let expirationHeight = new BigNumber(currentBlockNumber).add('10000000000000000000000000000').toString(10);

  let allAuthPromises = [],
    len = wallets.length;
  while (len--) {
    let thisAuthPromise = tokenHolder
      .authorizeSession(ephemeralKey, spendingLimit, expirationHeight)
      .send({
        from: wallets[0],
        gasPrice: gasPrice,
        gas: gasLimit
      })
      .then(function(receipt) {
        console.log(
          wallets[0],
          ' has authorized ',
          ephemeralKey,
          ' to use tokenHolder contract (',
          tokenHolder.address(),
          '). receipt:',
          receipt
        );
        return receipt;
      });
    allAuthPromises.push(thisAuthPromise);
  }

  return Promise.all(allAuthPromises);
};

// Step #9: Validate if ephemeral-key is authorized.
async function validateEphemeralKeySession(tokenHolder, ephemeralKey) {
  let isAuthorized = await tokenHolder.isAuthorizedEphemeralKey(ephemeralKey).call({});

  if (isAuthorized) {
    console.log('ephemeral-key', ephemeralKey, 'is authorized to spend using tokenHolder', tokenHolder.address());
  }
}

// Step #10: Lets spend using ephemeral-key

async function main() {
  //Step #5
  await createTokenEconomy();

  //Step #6
  await createTokenHolders(2);

  //Step #7
  let amountToFund = web3.utils.toWei('100');
  await fundTokenHolders(deployerAddress, amountToFund);
}

main();
//transferRuleAddress = '0xC3e929e03F36f2de2195e75f988b31a8529f7837';
