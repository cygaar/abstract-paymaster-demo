// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721A} from "erc721a/contracts/ERC721A.sol";

contract SampleNFT is ERC721A {
    constructor() ERC721A("Sample Abstract NFT", "NFT") {}

    function mint(address to, uint256 qty) external {
        require(qty < 11, "Can't mint that many NFTs at once buddy");
        _mint(to, qty);
    }
}
