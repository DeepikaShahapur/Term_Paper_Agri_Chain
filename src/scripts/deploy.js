const { ethers, network } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  const balance    = await ethers.provider.getBalance(deployer.address);

  console.log("\n╔════════════════════════════════════════╗");
  console.log("║        AgriChain Deployment            ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`  Network  : ${network.name}`);
  console.log(`  Deployer : ${deployer.address}`);
  console.log(`  Balance  : ${ethers.formatEther(balance)} ETH\n`);

  // 1. Escrow
  process.stdout.write("  1/3  Deploying Escrow ...     ");
  const Escrow  = await ethers.getContractFactory("Escrow");
  const escrow  = await Escrow.deploy();
  await escrow.waitForDeployment();
  const escrowAddr = await escrow.getAddress();
  console.log("✓", escrowAddr);

  // 2. Reputation
  process.stdout.write("  2/3  Deploying Reputation ... ");
  const Reputation  = await ethers.getContractFactory("Reputation");
  const reputation  = await Reputation.deploy();
  await reputation.waitForDeployment();
  const repAddr = await reputation.getAddress();
  console.log("✓", repAddr);

  // 3. AgriChain
  process.stdout.write("  3/3  Deploying AgriChain ...  ");
  const AgriChain  = await ethers.getContractFactory("AgriChain");
  const agriChain  = await AgriChain.deploy(escrowAddr, repAddr);
  await agriChain.waitForDeployment();
  const agriAddr = await agriChain.getAddress();
  console.log("✓", agriAddr);

  // 4. Auto-verify deployer so they can immediately create products
  console.log("\n  Verifying deployer account ...");
  await agriChain.verifyUser(deployer.address);
  console.log("  ✓ Deployer verified:", deployer.address);

  // 5. Persist deployments.json in project root
  const deployments = {
    network:   network.name,
    chainId:   network.config.chainId,
    deployer:  deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      AgriChain:  agriAddr,
      Escrow:     escrowAddr,
      Reputation: repAddr,
    },
  };
  fs.writeFileSync(
    path.join(__dirname, "../deployments.json"),
    JSON.stringify(deployments, null, 2)
  );

  // 6. Write frontend/.env.local automatically
  const envLocal = path.join(__dirname, "../frontend/.env.local");
  const envLines = [
    `NEXT_PUBLIC_AGRICHAIN_ADDRESS=${agriAddr}`,
    `NEXT_PUBLIC_ESCROW_ADDRESS=${escrowAddr}`,
    `NEXT_PUBLIC_REPUTATION_ADDRESS=${repAddr}`,
    `NEXT_PUBLIC_CHAIN_ID=${network.config.chainId ?? 1337}`,
    `NEXT_PUBLIC_RPC_URL=${network.name === "localhost" ? "http://127.0.0.1:8545" : ""}`,
  ].join("\n");
  fs.writeFileSync(envLocal, envLines);

  console.log("\n╔════════════════════════════════════════╗");
  console.log("║        Deployment Complete!            ║");
  console.log("╚════════════════════════════════════════╝");
  console.log(`  AgriChain  : ${agriAddr}`);
  console.log(`  Escrow     : ${escrowAddr}`);
  console.log(`  Reputation : ${repAddr}`);
  console.log(`\n  Saved to   : deployments.json`);
  console.log(`  Frontend   : frontend/.env.local updated`);
  console.log(`\n  Next steps :`);
  console.log(`    cd frontend && npm install && npm run dev`);
  console.log(`    Open: http://localhost:3000\n`);

  // 7. Verify on block explorer for non-local networks
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("  Waiting for block confirmations before verifying ...");
    await escrow.deploymentTransaction().wait(6);
    await reputation.deploymentTransaction().wait(6);
    await agriChain.deploymentTransaction().wait(6);
    try {
      await hre.run("verify:verify", { address: escrowAddr, constructorArguments: [] });
      await hre.run("verify:verify", { address: repAddr,    constructorArguments: [] });
      await hre.run("verify:verify", { address: agriAddr,   constructorArguments: [escrowAddr, repAddr] });
      console.log("  ✓ All contracts verified on block explorer\n");
    } catch (e) {
      console.warn("  Verification warning:", e.message, "\n");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error(err); process.exit(1); });
