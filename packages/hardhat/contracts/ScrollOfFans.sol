// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

contract ScrollOfFans is ERC721, Ownable {

    constructor() ERC721("Scroll of Fans", "SOF") Ownable(msg.sender) {}

    function mint(uint256 tokenId, bytes memory signature) external {
        require(_ownerOf(tokenId) == address(0), "Token already minted");

        bytes32 messageHash = keccak256(abi.encode(msg.sender, tokenId));
        bytes32 ethSignedMessageHash = MessageHashUtils.toEthSignedMessageHash(messageHash);

        address signer = ECDSA.recover(ethSignedMessageHash, signature);
        require(signer == owner(), "Invalid signature");

        _mint(msg.sender, tokenId);
    }

    // Override _transfer to prevent transfers
    function _update(address to, uint256 tokenId, address auth) internal override(ERC721) returns(address) {
        address from = _ownerOf(tokenId);

        if(from != address(0) && to != address(0)) {
            revert("Soulbound: Transfer Failed");
        }

        return super._update(to, tokenId, auth);
    }

}