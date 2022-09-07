class APIFeatures {
  constructor(query) {
    this.query = query;
    this.queryString = '';
  }

  sort() {
    if (this.query.sortByOrder == '') {
      return (this.queryString += ' order by sortorder');
    }

    if (this.query.sortByName == '') {
      return (this.queryString += ' order by name');
    }
  }

  offset() {
    if (this.query.offset) {
      return (this.queryString += ` offset ${this.query.offset}`);
    }
  }

  length() {
    if (this.query.length)
      return (this.queryString += ` limit ${this.query.length}`);
  }

  getQueryString() {
    this.sort();
    this.offset();
    this.length();
    return this.queryString;
  }
}

module.exports = APIFeatures;
