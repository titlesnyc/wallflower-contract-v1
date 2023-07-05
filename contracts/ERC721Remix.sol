// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

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

// import {ERC721AUpgradeable} from "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
// import {IERC721AUpgradeable} from "erc721a-upgradeable/contracts/IERC721AUpgradeable.sol";
import 'erc721a-upgradeable/contracts/ERC721AUpgradeable.sol';
import "erc721a/contracts/ERC721A.sol";
// import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';

import "@openzeppelin/contracts/proxy/Clones.sol";

import "hardhat/console.sol";

contract ERC721Remix is ERC721AUpgradeable, OwnableUpgradeable {

    /// @dev This is the max mint batch size for the optimized ERC721A mint contract
    uint256 internal immutable MAX_MINT_BATCH_SIZE = 8;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    bool private _initialized = false;

    // Metadata
    string public remixUri;
    // _name, _symbol inherited
    // description is stored in URI

    // Sales Configuration
    uint256 public price;
    uint256 public maxSupply;
    uint256 public mintLimitPerWallet;
    uint256 public saleEndTime;

    // Derivative Configuration
    uint256 public royaltyBps;
    uint256 public mintFee;
    address public splitAddress;

    // Ownership
    // _owner is inherited

    // constructor(
    //     address _creator,
    //     string memory _name, 
    //     string memory _symbol, 
    //     string memory _uri, 
    //     address _split,
    //     uint256 _price,
    //     uint256 _maxSupply,
    //     uint256 _mintLimitPerWallet,
    //     uint256 _saleEndTime
    // ) ERC721A(_name, _symbol) {
    //     remixUri = _uri;
    //     splitAddress = _split;
    //     price = _price;
    //     maxSupply = _maxSupply;
    //     mintLimitPerWallet = _mintLimitPerWallet;
    //     saleEndTime = _saleEndTime;

    //     transferOwnership(_creator);
    // }

    function initialize(address _creator,
        string memory _name, 
        string memory _symbol, 
        string memory _uri, 
        address _split,
        uint256 _price,
        uint256 _maxSupply,
        uint256 _mintLimitPerWallet,
        uint256 _saleEndTime
    ) public initializerERC721A initializer {
        require(!_initialized, "Contract instance has already been initialized");

        console.log("owner:");
        
        //console.log(_owner.address);
        console.log("sender (init):");
        console.log(msg.sender);

        __ERC721A_init(_name, _symbol);
        __Ownable_init();


        //ERC721A.initialize(_name, _symbol);
        remixUri = _uri;
        splitAddress = _split;
        price = _price;
        maxSupply = _maxSupply;
        mintLimitPerWallet = _mintLimitPerWallet;
        saleEndTime = _saleEndTime;

        transferOwnership(_creator);

        _initialized = true;
    }

    function _baseURI() internal view override returns (string memory) {
        return remixUri;
    }

    function purchase(uint256 quantity) public payable {

        console.log("sender (purchase):");
        console.log(msg.sender);

        // Check sale active
        require(_saleActive(), "Sale has ended");

        // Check supply
        if (quantity + _totalMinted() > maxSupply) {
            revert("This drop is sold out");
        }

        // Check price
        uint256 expectedPrice = (price + mintFee) * quantity;
        require(msg.value == expectedPrice, "Incorrect purchase price");

        // Check limit
        if (mintLimitPerWallet != 0 && 
            _numberMinted(_msgSender()) + quantity > mintLimitPerWallet) {
            revert("Cannot purchase that many");
        }

        // Mint!
        _mintNFTs(_msgSender(), quantity);
    }

    /// Batch in size of 8 for ERC721A
    function _mintNFTs(address to, uint256 quantity) internal {
        do {
            uint256 toMint = quantity > MAX_MINT_BATCH_SIZE
                ? MAX_MINT_BATCH_SIZE
                : quantity;
            _mint({to: to, quantity: toMint});
            quantity -= toMint;
        } while (quantity > 0);
    }

    function _saleActive() internal view returns (bool) {
        console.log("active?");
        if (saleEndTime == 0) { return true; }
        return saleEndTime > block.timestamp;
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721AUpgradeable)
        returns (string memory)
    {
        require(_exists(tokenId), "invalid token ID");
        return _baseURI();
    }
}
