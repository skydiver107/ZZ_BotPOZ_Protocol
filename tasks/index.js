task(
  "pozzlenautsSetTrustedRemote",
  "setTrustedRemote(chainId, sourceAddr) to allow the local contract to send/receive messages from known source contracts",
  require("./pozzlenautsSetTrustedRemote")
).addParam(
  "targetNetwork",
  "the target network to let this instance receive messages from"
);

//
task(
  "pozzlenautsOwnerOf",
  "ownerOf(tokenId) to get the owner of a token",
  require("./pozzlenautsOwnerOf")
).addParam("tokenId", "the tokenId of ONFT");

//
task("pozzlenautsMint", "mint() mint ONFT", require("./pozzlenautsMint"));

//
task(
  "pozzlenautsSend",
  "send an ONFT nftId from one chain to another",
  require("./pozzlenautsSend")
)
  .addParam("targetNetwork", "the chainId to transfer to")
  .addParam("tokenId", "the tokenId of ONFT");

//
task("setFlGl", "set FL and GL Merkel Root", require("./setFlGl")).addParam(
  "roottype",
  "rootType FL or GL"
);

task("freeListMint", "Reset wallets for free mint", require("./freeListMint"));
