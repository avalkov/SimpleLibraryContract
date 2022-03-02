const { expect } = require("chai");
const { ethers } = require("hardhat");


function expectObjectsEqual(obj, expectedObj) {
  for (const [key, value] of Object.entries(expectedObj)) {
      if (typeof value == "object") {
          expectObjectsEqual(obj[key], value);
          continue;
      }
      expect(obj[key]).to.equal(value);
  }
}

function expectArraysEqual(arr, expectedArr) {
    expect(arr.length).to.equal(expectedArr.length);

    for (let i = 0; i < arr.length; i++) {
        expectObjectsEqual(arr[i], expectedArr[i]);
    }
}

describe("Library", function() {
  const FIRST_BOOK_TITLE = "Prelude to Foundation";
  const SECOND_BOOK_TITLE = "Forward the Foundation";

  let deployer, client1, client2;

  before(async() => {
    libraryFactory = await ethers.getContractFactory("Library");
    library = await libraryFactory.deploy();
    await library.deployed();

    [deployer, client1, client2] = await ethers.getSigners();
  })

  
  it("Should get available books when there are no books", async () => {
    const availableBooks = await library.getAvailableBooks();
    expectArraysEqual(availableBooks, []);
  });

  it("Should add book", async () => {  
    const tx = await library.addBook(FIRST_BOOK_TITLE, 1);
    await tx.wait();
    const availableBooks = await library.getAvailableBooks();

    expectArraysEqual(availableBooks, [
      {
        id: 0,
        title: FIRST_BOOK_TITLE,
        availabeCopies: 1,
      }
    ]);
  });

  it("Should increase copies of book when adding already existing book", async () => {
    const tx = await library.addBook(FIRST_BOOK_TITLE, 1);
    await tx.wait();
    const availableBooks = await library.getAvailableBooks();

    expectArraysEqual(availableBooks, [
      {
        id: 0,
        title: FIRST_BOOK_TITLE,
        availabeCopies: 2,
      }
    ]);
  });

  it("Should add second book", async () => {
    const tx = await library.addBook(SECOND_BOOK_TITLE, 2);
    await tx.wait();

    const availableBooks = await library.getAvailableBooks();
    expectArraysEqual(availableBooks, [
      {
        id: 0,
        title: FIRST_BOOK_TITLE,
        availabeCopies: 2,
      },
      {
        id: 1,
        title: SECOND_BOOK_TITLE,
        availabeCopies: 2,
      }
    ]);
  });

  it("Should borrow existing book", async () => {
    const tx = await library.borrowBook(1);
    await tx.wait();

    const borrowedBooks = await library.getUserBorrowedBooks();    
    expectArraysEqual(borrowedBooks, [
      {
        id: 1,
        title: SECOND_BOOK_TITLE,
      }
    ]);
  });

  it("Should borrow second book", async () => {
    const tx = await library.borrowBook(0);
    await tx.wait();

    const borrowedBooks = await library.getUserBorrowedBooks();    
    expectArraysEqual(borrowedBooks, [
      {
        id: 1,
        title: SECOND_BOOK_TITLE,
      },
      {
        id: 0,
        title: FIRST_BOOK_TITLE,
      }
    ]);
  });

  it("Should return correct available books count after some are borrowed", async () => {
    const availableBooks = await library.getAvailableBooks();

    expectArraysEqual(availableBooks, [
      {
        id: 0,
        title: FIRST_BOOK_TITLE,
        availabeCopies: 1,
      },
      {
        id: 1,
        title: SECOND_BOOK_TITLE,
        availabeCopies: 1,
      }
    ]);
  });

  it("Should return book", async () => {
    const tx = await library.returnBook(0);
    await tx.wait();

    const borrowedBooks = await library.getUserBorrowedBooks();    
    expectArraysEqual(borrowedBooks, [
      {
        id: 1,
        title: SECOND_BOOK_TITLE,
      }
    ]);
  });

  it("Should get borrowers history for book", async () => {
    const borrowers = await library.getBookBorrowersHistory(1);
    expectArraysEqual(borrowers, [deployer.address]);
  });

  it("Should fail to borrow invalid book id", async () => {
    await expect(library.borrowBook(999)).to.be.revertedWith("Invalid book id");
  });

  it("Should fail to return invalid book id", async () => {
    await expect(library.returnBook(999)).to.be.revertedWith("Invalid book id");
  });

  it("Should fail to return not borrowed book", async () => {
    await expect(library.returnBook(0)).to.be.revertedWith("Book is not borrowed");
  });

  it("Should fail to borrow already borrowed book", async () => {
    await expect(library.borrowBook(1)).to.be.revertedWith("Book is already borrowed");
  });

  it("Should fail to add book with empty title", async () => {
    await expect(library.addBook("", 1)).to.be.revertedWith("Empty title");
  });

  it("Should fail to add book with zero copies", async () => {
    await expect(library.addBook("Some book title", 0)).to.be.revertedWith("Zero copies");
  });

  it("Should fail to borrow book when no copies are left", async () => {
    const tx = await library.connect(client1).borrowBook(1);
    await tx.wait();

    await expect(library.connect(client2).borrowBook(1)).to.be.revertedWith("No book copies left");
  });

  it("Should not be added to books borrowers history if borrowed this book in the past", async () => {
    const tx = await library.borrowBook(0);
    await tx.wait();

    const borrowers = await library.getBookBorrowersHistory(0);
    expectArraysEqual(borrowers, [deployer.address]);
  });
});
