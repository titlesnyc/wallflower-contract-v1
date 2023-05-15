//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.17;

/*                                                                                                      
                                @@@@@@@  @@@@@  .                                                                       
                            @@@@@@@@@* @@@@@  /@@@@@@@@@%                                                               
                          @ @@@      #@@@@&      @@@@@@@@@@@@@@                                                         
                          @@@       @@@@@          /@@@@@@@@@@@@@@@@                                                    
                        *@@       @@@@@           @@@@@@@     @@@@@   @@(                                               
                       @@/      @@@@@*          @@@@@@@             @@@@@@@@                                            
                       @@@                    *@@@@@@%            (@@@@@@@                                              
                      %@@@@                    @@@@@             @@@@@@@%                                               
                   @@@@ @@@@.                                  @@@@@@@@                                                 
                  @@@@@@ /@@@                                 @@@@@@@*                 .@&                              
                 @@@ @@@@@@@%  @                              &@@@@@@@@@              @@@@@@                            
                 @@@@ .@@@@  @@@@@                                @@@@@@@@@(         @@@@@@@@@*                         
                 *@@@@@@      .@@@@@                                  @@@@@@@@@    @@@@@@@%@@@@@&                       
                   @@@@@   @@@@  @@@@@/                                  *@@@@@   @@@@@@@@&  @@@@@%                     
                        @@  @@@@@  @@@@@@                                       @@@@@@@@@@@@@  @@@@                     
                       @@@@@, @@@@@@@@@                                         @@@@@@@  @@@@@@  @                      
                         @@@@@@ @@@@@&                                            /@@@@@@  @@@@   @@@@@                 
                           @@@@@@@@@              (                                  @@@@@@. .   @@@@@@@                
                              @@@@               @@@@@&                                @@@@@@   *@@@ @@@                
                                   @@@@(       @@@@@@   @@@                              &@@  @@ @@@/ @@                
                                    @@@@@@@   @@@@@@   @@@@@@@@@                             &@@@ @@@#@                 
                                       @@@@@@@@@@@         /@@@@@@@@@/                       %@@@  @@                   
                                          .@@@@@@          @@@@@@@@@@@@@  @@#                 @@@@#@                    
                                              /          %@@@@@          @@@@@  @@@@@@@@@@@@@@ @@@@                     
                                                        @@@@@@         @@@@@*  *@@@@@@@@@@@@@   @/                      
                                                       %@@@@          @@@@@        @@@@                                 
                                                                    &@@@@%       (@@@(                                  
                                                                   @@@@@        @@@@                                    
                                                                               @@@@                                                           
*/

import "./ERC721Remix.sol";

import {ISplitMain} from "splits-utils/src/interfaces/ISplitMain.sol";

contract TitlesDeployer {
    address[] public remixContractArray;
    ISplitMain public immutable splitMain;

    event PublishedRemix(
        address indexed creator,
        address indexed remixContractAddress
    );

    constructor(address _splitMainAddress) {
        splitMain = ISplitMain(_splitMainAddress);
    }

    function publishRemix(string memory _name, string memory _symbol, string memory _uri, address[] memory accounts, uint32[] memory allocations) public {

        address splitAddress = splitMain.createSplit({
            accounts: accounts,
            percentAllocations: allocations,
            distributorFee: 0,
            controller: 0xd9111EbeC09Ae2cb4778e6278d5959929bAA59Cc
        });

        ERC721Remix remixContract = new ERC721Remix(_name, _symbol, _uri, splitAddress);
        address remixContractAddress = address(remixContract);
        remixContractArray.push(remixContractAddress);

        emit PublishedRemix({
            creator: msg.sender,
            remixContractAddress: remixContractAddress
        });
    }
}