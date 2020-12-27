const truffleAssert = require("truffle-assertions");

async function shouldThrow(promise, expectedErrorMsg) {
  await truffleAssert.reverts(promise, expectedErrorMsg);
}

module.exports = {
  shouldThrow,
};
