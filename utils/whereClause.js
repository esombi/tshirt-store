// base - product.find()
//base - product.find({email: {"Sheddy@lco.dev"}})

//bigQ - //search=coder&page=2&category=shortsleeves&rating[gte]=4
// &price[lte]=999&price[gte]=199&limit=5

class whereClause {
  constructor(base, bigQ) {
    this.base = base;
    this.bigQ = bigQ;
  }

  search() {
    const searchword = this.bigQ.search
      ? {
          name: {
            $regex: this.bigQ.search,
            $options: "i",
          },
        }
      : {};
    this.base = this.base.find({ ...searchword });
    return this;
  }

  filter() {
    const copyQ = { ...this.bigQ };

    delete copyQ["search"];
    delete copyQ["limit"];
    delete copyQ["page"];

    //convert bigQ into a string => copyQ
    let stringofCopyQ = JSON.stringify(copyQ);

    stringofCopyQ = stringofCopyQ.replace(
      /\b(gte|lte|gt|lt)\b/g,
      (m) => `$${m}`
    );

    const jsonOfcopyQ = JSON.parse(stringofCopyQ);

    this.base = this.base.find(jsonOfcopyQ);

    return this;
  }

  pager(resultperPage) {
    let currentPage = 1;
    if (this.bigQ.page) {
      currentPage = this.bigQ.page;
    }

    const skipVal = resultperPage * (currentPage - 1);

    this.base = this.base.limit(resultperPage).skip(skipVal);
    return this;
  }
}

module.exports = whereClause;
