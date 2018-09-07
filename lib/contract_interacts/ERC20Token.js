'use strict';

const InstanceComposer = require('../../instance_composer');
const generator = require('../../lib/contract_interacts/generator');

const path = require('path'),
  fs = require('fs');

function parseFile(filePath, options) {
  filePath = path.join(__dirname, '/' + filePath);
  const fileContent = fs.readFileSync(filePath, options || 'utf8');
  return JSON.parse(fileContent);
}

const jsonInterface = parseFile('../../contracts/abi/MockToken.abi', 'utf8');

const ERC20Token = function(contractAddress, options) {
  const oThis = this,
    web3Obj = oThis.ic().chainWeb3(),
    _instance = new web3Obj.eth.Contract(jsonInterface, contractAddress, options || {});

  oThis._getAuxiliaryContract = function() {
    return _instance;
  };

  oThis.address = function() {
    return contractAddress;
  };

  //Bind Tokenholder auxiliary methods.
  generator.bindAuxiliaryMethods(oThis, '_getAuxiliaryContract');
};

const proto = (ERC20Token.prototype = {
  constructor: ERC20Token,

  _getAuxiliaryContract: null
});

let auxiliaryContractAbi = jsonInterface;
let auxiliaryContractGetter = '_getAuxiliaryContract';
generator(proto, null, null, auxiliaryContractAbi, auxiliaryContractGetter);

InstanceComposer.registerShadowableClass(ERC20Token, 'ERC20Token');

module.exports = ERC20Token;
