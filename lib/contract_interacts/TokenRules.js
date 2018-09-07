'use strict';

const path = require('path'),
  fs = require('fs');

const InstanceComposer = require('../../instance_composer');
const generator = require('../../lib/contract_interacts/generator');

function parseFile(filePath, options) {
  filePath = path.join(__dirname, '/' + filePath);
  const fileContent = fs.readFileSync(filePath, options || 'utf8');
  return JSON.parse(fileContent);
}

const tokenRulesJsonInterface = parseFile('../../contracts/abi/TokenRules.abi', 'utf8');

const TokenRules = function(contractAddress) {
  const oThis = this,
    web3Obj = oThis.ic().chainWeb3(),
    tokenRulesInstance = new web3Obj.eth.Contract(tokenRulesJsonInterface, contractAddress, {});

  oThis._getAuxiliaryContract = function() {
    return tokenRulesInstance;
  };

  oThis.address = function() {
    return contractAddress;
  };

  //Bind TokenRules auxiliary methods.
  generator.bindAuxiliaryMethods(oThis, '_getAuxiliaryContract');
};

const proto = (TokenRules.prototype = {
  constructor: TokenRules,

  _getAuxiliaryContract: null
});

let auxiliaryContractAbi = tokenRulesJsonInterface;
let auxiliaryContractGetter = '_getAuxiliaryContract';
generator(proto, null, null, auxiliaryContractAbi, auxiliaryContractGetter);

InstanceComposer.registerShadowableClass(TokenRules, 'TokenRules');

module.exports = TokenRules;
