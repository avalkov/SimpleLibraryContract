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

  before(async() => {
    libraryFactory = await ethers.getContractFactory("Library");
    library = await libraryFactory.deploy();
    await library.deployed();
  })

  
  it("Should get available books when there are no books", async function() {
    let availableBooks = await library.getAvailableBooks();
    expectArraysEqual(availableBooks, []);
  });

  it("Should add book", async function() {  
    await library.addBook(FIRST_BOOK_TITLE, 1);
    let availableBooks = await library.getAvailableBooks();

    expectArraysEqual(availableBooks, [
      {
        id: 0,
        title: FIRST_BOOK_TITLE,
        availabeCopies: 1,
      }
    ]);
  });

  it("Should increase copies of book when adding already existing book", async function() {
    await library.addBook(FIRST_BOOK_TITLE, 1);
    let availableBooks = await library.getAvailableBooks();

    expectArraysEqual(availableBooks, [
      {
        id: 0,
        title: FIRST_BOOK_TITLE,
        availabeCopies: 2,
      }
    ]);
  });

  it("Should add second book", async function() {
    await library.addBook(SECOND_BOOK_TITLE, 2);
    let availableBooks = await library.getAvailableBooks();

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

  it("Should borrow existing book", async function() {
    const book = await library.borrowBook(1);
    console.log(book);

    expect(book).to.be.equal({
      title: SECOND_BOOK_TITLE,
    });
  });
});
