// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
pragma abicoder v2;

import "./Ownable.sol";


contract Library is Ownable {
    
    struct Book {
        string title;
    }
    
    Book[] public books;
    
    mapping (uint => uint) booksCopies;
    mapping (uint => address[]) booksBorrowers;
    mapping (uint => bool) currentlyBorrowed;
    
    modifier onlyNotBorrowed(uint _bookId) {
        require(_bookId <= books.length - 1, "Invalid book id");
        require(currentlyBorrowed[getUniqueBorrowerBookId(_bookId)] == false, "Book is already borrowed");
        _;
    }
    
    modifier onlyAlreadyBorrowed(uint _bookId) {
        require(_bookId <= books.length - 1, "Invalid book id");
        require(currentlyBorrowed[getUniqueBorrowerBookId(_bookId)] == true, "Book is not borrowed");
        _;
    }
    
    function addBook(string calldata _title, uint _copies) external onlyOwner {
        bool isTitleFound = false;
        uint titleId;
        for (uint i = 0; i < books.length; i++) {
            if (keccak256(abi.encodePacked(books[i].title))  == keccak256(abi.encodePacked(_title))) {
                isTitleFound = true;
                titleId = i;
                break;
            }
        }
        
        if (isTitleFound) {
            booksCopies[titleId] += _copies;
            return;
        }
        
        books.push(Book(_title));
        titleId = books.length - 1;
        booksCopies[titleId] = _copies;
    }
    
    function getAvailableBooks() external view returns(uint[] memory) {
        uint[] memory result = new uint[](getAvailableBooksCount());
        
        uint resultIdx = 0;
        for (uint i = 0; i < books.length; i++) {
            if (booksCopies[i] > 0) {
                result[resultIdx] = i;
                resultIdx++;
            }
        }
        
        return result;
    }
    
    function borrowBook(uint _bookId) external onlyNotBorrowed(_bookId) returns(Book memory) {
        require(booksCopies[_bookId] > 0, "No book copies left");
        
        booksCopies[_bookId]--;
        
        address[] storage borrowers = booksBorrowers[_bookId];
        
        bool isAlreadyAdded = false;
        
        for (uint i = 0; i < borrowers.length; i++) {
            if (borrowers[i] == address(msg.sender)) {
                isAlreadyAdded = true;
                break;
            }
        }
        
        if (!isAlreadyAdded) {
            booksBorrowers[_bookId].push(address(msg.sender));
        }
        
        currentlyBorrowed[getUniqueBorrowerBookId(_bookId)] = true;
                
        Book memory book = books[_bookId];

        return book;
    }
    
    function returnBook(uint _bookId) external onlyAlreadyBorrowed(_bookId) {
        booksCopies[_bookId]++;
        delete currentlyBorrowed[getUniqueBorrowerBookId(_bookId)];
    }
    
    function getBookBorrowersHistory(uint _bookId) external view returns(address[] memory) {
        address[] memory result = new address[](booksBorrowers[_bookId].length);
        address[] storage borrowers = booksBorrowers[_bookId];
        
        for (uint i = 0; i < borrowers.length; i++) {
            result[i] = borrowers[i];
        }
        
        return result;
    }
    
    function getAvailableBooksCount() private view returns(uint) {
        uint count = 0;
        
        for (uint i = 0; i < books.length; i++) {
            if (booksCopies[i] > 0) {
                count++;
            }
        }
        
        return count;
    }
    
    function getUniqueBorrowerBookId(uint _bookId) private view returns(uint) {
        return uint(keccak256(abi.encodePacked(msg.sender, _bookId)));
    }
}