import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys the FriendsOfScroll contract using the deployer account.
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployFriendsOfScroll: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("FriendsOfScroll", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

export default deployFriendsOfScroll;

deployFriendsOfScroll.tags = ["FriendsOfScroll"];