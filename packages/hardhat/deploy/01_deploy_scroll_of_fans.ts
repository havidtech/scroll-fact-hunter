import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

/**
 * Deploys the ScrollOfFans contract using the deployer account.
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployScrollOfFans: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("ScrollOfFans", {
    from: deployer,
    args: [],
    log: true,
    autoMine: true,
  });
};

export default deployScrollOfFans;

deployScrollOfFans.tags = ["ScrollOfFans"];