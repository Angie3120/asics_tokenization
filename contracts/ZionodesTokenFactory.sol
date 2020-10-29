// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.5.0 <0.8.0;

import "./ZionodesToken.sol";
import "./Roles.sol";

contract ZionodesTokenFactory is Roles {
    constructor ()
        Roles(_msgSender())
        public
    {

    }
}
