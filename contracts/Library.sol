// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
pragma abicoder v2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";


contract Library is Ownable {
    
    struct BookUI {
        uint id;
        string title;
        uint availabeCopies;
    }

    struct Book {
        string title;
    }
    
    Book[] public books;

    mapping (uint => uint) booksCopies;
    mapping (uint => bool) addedBooksTitles;
    mapping (uint => uint) titleIdToBookId;
    mapping (uint => address[]) booksBorrowersHistory;
    mapping (uint => mapping(address => bool)) booksBorrowers;
    mapping (uint => bool) currentlyBorrowed;
    

    modifier onlyValidBookId(uint _bookId) {
        require(_bookId <= books.length - 1, "Invalid book id");
        _;
    }

    modifier onlyNotBorrowed(uint _bookId) {
        require(currentlyBorrowed[getUniqueBorrowerBookId(_bookId)] == false, "Book is already borrowed");
        _;
    }
    
    modifier onlyAlreadyBorrowed(uint _bookId) {
        require(currentlyBorrowed[getUniqueBorrowerBookId(_bookId)] == true, "Book is not borrowed");
        _;
    }
    
    function addBook(string calldata _title, uint _copies) external onlyOwner {
        require(bytes(_title).length > 0, "Empty title");
        require(_copies > 0, "Zero copies");

        uint titleId = uint(keccak256(abi.encodePacked(_title)));

        if (addedBooksTitles[titleId]) {
            booksCopies[titleIdToBookId[titleId]] += _copies;
            return;
        }
        
        books.push(Book(_title));
        
        addedBooksTitles[titleId] = true;
        uint bookId = books.length - 1;
        titleIdToBookId[titleId] = bookId;
        booksCopies[bookId] = _copies;
    }
    
    function borrowBook(uint _bookId) external onlyValidBookId(_bookId) onlyNotBorrowed(_bookId) {
        require(booksCopies[_bookId] > 0, "No book copies left");
        
        if (!booksBorrowers[_bookId][msg.sender]) {
            booksBorrowersHistory[_bookId].push(address(msg.sender));
        }
        
        booksBorrowers[_bookId][msg.sender] = true;
        currentlyBorrowed[getUniqueBorrowerBookId(_bookId)] = true;

        booksCopies[_bookId]--;
    }
    
    function returnBook(uint _bookId) external onlyValidBookId(_bookId) onlyAlreadyBorrowed(_bookId) {        
        booksCopies[_bookId]++;
        delete currentlyBorrowed[getUniqueBorrowerBookId(_bookId)];
    }
    
    function getUserBorrowedBooks() external view returns(BookUI[] memory result) {

    }

    function getBookBorrowersHistory(uint _bookId) external view returns(address[] memory) {
        return booksBorrowersHistory[_bookId];
    }
    
    function getAvailableBooks() external view returns(BookUI[] memory result) {
        result = new BookUI[](books.length);

        for (uint i = 0; i < books.length; i++) {
            console.log("i ", i);
            console.log("booksCopies[i] ", booksCopies[i]);
            result[i] = BookUI({
                id: i, 
                title: books[i].title,
                availabeCopies: booksCopies[i]
            });
        }
    }
    
    function getUniqueBorrowerBookId(uint _bookId) private view returns(uint) {
        return uint(keccak256(abi.encodePacked(msg.sender, " ", _bookId)));
    }
}