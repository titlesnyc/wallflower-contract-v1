// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

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

import "erc721a-upgradeable/contracts/ERC721AUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "operator-filter-registry/src/upgradeable/DefaultOperatorFiltererUpgradeable.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

import "hardhat/console.sol";

contract ERC721Remix is 
    ERC721AUpgradeable,  
    ERC2981Upgradeable, 
    DefaultOperatorFiltererUpgradeable,
    OwnableUpgradeable
{

    /// @dev This is the max mint batch size for the optimized ERC721A mint contract
    uint256 internal immutable MAX_MINT_BATCH_SIZE = 8;

    uint256 internal immutable FUNDS_SEND_GAS_LIMIT = 210_000;

    bool private _initialized = false;

    // Metadata
    string public remixUri;

    // Sales Configuration
    uint256 public price;
    uint256 public maxSupply;
    uint256 public mintLimitPerWallet;
    uint256 public saleEndTime;

    // Derivative Configuration
    uint256 private immutable DERIVATIVE_FEE = 999000000000000; // 0.000999ETH
    uint96 public immutable ROYALTY_BPS = 1000; // 10%
    address public creatorProceedRecipient;
    address public derivativeFeeRecipient;

    function initialize(address _creator,
        string memory _name, 
        string memory _symbol, 
        string memory _uri, 
        address _creatorProceedRecipient,
        address _derivativeFeeRecipient,
        uint256 _price,
        uint256 _maxSupply,
        uint256 _mintLimitPerWallet,
        uint256 _saleEndTime
    ) public initializerERC721A initializer {
        require(!_initialized, "Contract instance has already been initialized");

        console.log("sender (init):");
        console.log(msg.sender);

        __ERC721A_init(_name, _symbol);
        __ERC2981_init();
        __Ownable_init();
        __DefaultOperatorFilterer_init();

        remixUri = _uri;
        creatorProceedRecipient = _creatorProceedRecipient;
        derivativeFeeRecipient = _derivativeFeeRecipient;
        price = _price;
        maxSupply = _maxSupply;
        mintLimitPerWallet = _mintLimitPerWallet;
        saleEndTime = _saleEndTime;

        transferOwnership(_creator);
        _setDefaultRoyalty(_creatorProceedRecipient, ROYALTY_BPS);

        _initialized = true;
    }

    function contractURI() external view returns (string memory) {
        return remixUri;
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
        if (maxSupply != 0 &&
            quantity + _totalMinted() > maxSupply) {
            revert("This drop is sold out");
        }

        // Check price
        uint256 expectedPrice = (price + DERIVATIVE_FEE) * quantity;
        require(msg.value == expectedPrice, "Incorrect purchase price");

        // Check limit
        if (mintLimitPerWallet != 0 && 
            _numberMinted(_msgSender()) + quantity > mintLimitPerWallet) {
            revert("Cannot purchase that many");
        }

        // Mint!
        _mintNFTs(_msgSender(), quantity);

        // Pay
        _distributeFunds(msg.value, quantity);
    }

    function _distributeFunds(uint256 totalFunds, uint256 quantity) internal {
        uint256 derivativeFee = DERIVATIVE_FEE * quantity;
        (bool feeSuccess, ) = derivativeFeeRecipient.call{value: derivativeFee, gas: FUNDS_SEND_GAS_LIMIT}("");
        require(feeSuccess, "Failed to send derivative fee");

        uint256 proceeds = totalFunds - derivativeFee;
        (bool proceedsSuccess, ) = creatorProceedRecipient.call{value: proceeds, gas: FUNDS_SEND_GAS_LIMIT}("");
        require(proceedsSuccess, "Failed to send proceeds");
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

    function setApprovalForAll(address operator, bool approved) public override onlyAllowedOperatorApproval(operator) {
        super.setApprovalForAll(operator, approved);
    }

    function approve(address operator, uint256 tokenId) public payable override onlyAllowedOperatorApproval(operator) {
        super.approve(operator, tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) public payable override onlyAllowedOperator(from) {
        super.transferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public payable override onlyAllowedOperator(from) {
        super.safeTransferFrom(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data)
        public
        payable
        override
        onlyAllowedOperator(from)
    {
        super.safeTransferFrom(from, to, tokenId, data);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view    
        override(
            ERC721AUpgradeable,
            ERC2981Upgradeable
        )
        returns (bool)
    {
        return
            super.supportsInterface(interfaceId) ||
            ERC721AUpgradeable.supportsInterface(interfaceId) ||
            ERC2981Upgradeable.supportsInterface(interfaceId);
    }

}
