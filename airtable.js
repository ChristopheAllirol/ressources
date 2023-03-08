 header("Content-Type: application/javascript");

class Airtable {
  constructor(base, table, key) {
    this.base = base;
    this.table = table;
    this.key = key;
    this.loadedTime = undefined;
    this.size = 0;
    this.settings = undefined;
    this.records = undefined;
  }
  onload() {}
  onerror() {}
  onprogress() {}

  listRecords() {
    this.records = undefined;
    this.loadedTime = undefined;
    this.size = 0;
    this.offset = undefined;
    this.part = 0;
    this.listRecordsReal();
  }
  listRecordsReal() {
    !this.records ? (this.records = []) : void 0;

    let query = [];
    this.offset ? query.push(`offset=${this.offset}`) : void 0;

    if (this.settings?.fields) {
      for (let i = 0; i < this.settings.fields.length; i++) {
        query.push(`fields%5B%5D=${encodeURI(this.settings.fields[i])}`);
      }
    }
    this.settings?.formula
      ? query.push(`filterByFormula=${encodeURI(this.settings.formula)}`)
      : void 0;
    this.settings?.maxRecords
      ? query.push(`maxRecords=${this.settings.maxRecords}`)
      : void 0;
    this.settings?.pageSize
      ? query.push(`pageSize=${this.settings.pageSize}`)
      : void 0;
    if (this.settings?.sort) {
      for (let i = 0; i < this.settings.sort.length; i++) {
        query.push(
          `sort%5B0%5D%5Bfield%5D=${encodeURI(
            this.settings.sort[i].field
          )}&sort%5B0%5D%5Bdirection%5D=${
            this.settings.sort[i]?.direction
              ? encodeURI(this.settings.sort[i].direction)
              : "asc"
          }`
        );
      }
    }
    this.settings?.view
      ? query.push(`view=${encodeURI(this.settings.view)}`)
      : void 0;
    this.settings?.cellFormat
      ? query.push(`cellFormat=${encodeURI(this.settings.cellFormat)}`)
      : void 0;
    this.settings?.timeZone
      ? query.push(`timeZone=${encodeURI(this.settings.timeZone)}`)
      : void 0;
    this.settings?.userLocale
      ? query.push(`userLocale=${encodeURI(this.settings.userLocale)}`)
      : void 0;
    this.settings?.returnFieldsByFieldId
      ? query.push(
          `returnFieldsByFieldId=${encodeURI(
            this.settings.returnFieldsByFieldId
          )}`
        )
      : void 0;

    let xmlHttp = new XMLHttpRequest();
    xmlHttp.open(
      "GET",
      `https://api.airtable.com/v0/${this.base}/${encodeURI(
        this.table
      )}?${query.join("&")}`,
      true
    );
    xmlHttp.onload = function (e) {
      this.loadedTime = new Date();
      if (xmlHttp.response.error) {
        this.size = e.loaded;
        this.records = [];
        this.onerror(xmlHttp.response);
      } else {
        let r = xmlHttp.response;
        for (let i = 0; i < r.records.length; i++) {
          r.records[i].createdTime = new Date(r.records[i].createdTime);
        }
        this.size += e.loaded;
        this.records = this.records.concat(r.records);
        delete r.offset;
        this.onprogress(r, this.part);
        this.part++;
        if (xmlHttp.response?.offset) {
          this.offset = xmlHttp.response.offset;
          this.listRecordsReal();
        } else {
          this.onload();
        }
      }
    }.bind(this);
    xmlHttp.onerror = function (e) {
      this.loadedTime = new Date();
      this.size = e.loaded;
      this.records = [];
      this.onerror({
        error: {
          type: "NETWORK_ERROR",
          message: "Could not access to the network"
        }
      });
    }.bind(this);
    xmlHttp.setRequestHeader("Authorization", `Bearer ${this.key}`);
    xmlHttp.responseType = "json";
    xmlHttp.send(null);
  }

  retrieveRecord(id) {
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.open(
      "GET",
      `https://api.airtable.com/v0/${this.base}/${encodeURI(this.table)}/${id}`,
      true
    );
    xmlHttp.onload = function (e) {
      this.loadedTime = new Date();
      if (xmlHttp.response.error) {
        this.size = e.loaded;
        this.records = [];
        this.onerror(xmlHttp.response);
      } else {
        this.records = [];
        this.records.push(xmlHttp.response);
        this.records[0].createdTime = new Date(this.records[0].createdTime);
        this.size = e.loaded;
        this.onload();
      }
    }.bind(this);
    xmlHttp.onerror = function () {
      this.loadedTime = new Date();
      this.size = e.loaded;
      this.records = [];
      this.onerror({
        error: {
          type: "NETWORK_ERROR",
          message: "Could not access to the network"
        }
      });
    }.bind(this);
    xmlHttp.setRequestHeader("Authorization", `Bearer ${this.key}`);
    xmlHttp.responseType = "json";
    xmlHttp.send(null);
  }

  createRecords(records) {
    this.settings.pageSize = this.settings.pageSize
      ? this.settings.pageSize
      : 10;
    this.size = 0;
    this.records = [];
    this.part = 0;
    this.partNb =
      Math.trunc(records.length / this.settings.pageSize) +
      Math.ceil(
        records.length / this.settings.pageSize -
          Math.trunc(records.length / this.settings.pageSize)
      );
    let part = [];
    for (let i = 0; i < records.length; i++) {
      if (part.length == this.settings.pageSize) {
        this.createRecordReal(part, i == records.length);
        part = [];
      }
      part.push({ fields: records[i] });
    }
    part != [] ? this.createRecordReal(part, true) : void 0;
  }
  createRecordReal(part, f) {
    this.loadedTime = new Date();
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.open(
      "POST",
      `https://api.airtable.com/v0/${this.base}/${encodeURI(this.table)}`,
      true
    );
    xmlHttp.onload = function (e) {
      this.loadedTime = new Date();
      if (xmlHttp.response.error) {
        this.size = e.loaded;
        this.records = [];
        this.onerror(xmlHttp.response);
      } else {
        let r = xmlHttp.response;
        for (let i = 0; i < r.records.length; i++) {
          r.records[i].createdTime = new Date(r.records[i].createdTime);
        }
        this.size += e.loaded;
        this.records = this.records.concat(r.records);
        if (f) {
          this.part++;
          this.onprogress(xmlHttp.response, this.part, this.partNb);
          delete this.part;
          delete this.partNb;
          this.onload();
        } else {
          this.part++;
          this.onprogress(xmlHttp.response, this.part, this.partNb);
        }
      }
    }.bind(this);
    xmlHttp.setRequestHeader("Authorization", `Bearer ${this.key}`);
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.responseType = "json";
    xmlHttp.onerror = function (e) {
      this.loadedTime = new Date();
      this.size = e.loaded;
      this.records = [];
      delete this.part;
      delete this.partNb;
      this.onerror({
        error: {
          type: "NETWORK_ERROR",
          message: "Could not access to the network"
        }
      });
    }.bind(this);
    xmlHttp.send(
      JSON.stringify({
        records: part,
        typecast: this.settings?.typecast ? this.settings.typecast : false
      })
    );
  }

  updateRecords(records) {
    this.settings.destructive = this.settings?.destructive
      ? this.settings.destructive
      : false;
    this.settings.pageSize = this.settings.pageSize
      ? this.settings.pageSize
      : 10;
    this.size = 0;
    this.records = [];
    this.part = 0;
    this.partNb =
      Math.trunc(records.length / this.settings.pageSize) +
      Math.ceil(
        records.length / this.settings.pageSize -
          Math.trunc(records.length / this.settings.pageSize)
      );
    let part = [];
    for (let i = 0; i < records.length; i++) {
      if (part.length == this.settings.pageSize) {
        this.updateRecordsReal(part, i == records.length);
        part = [];
      }
      part.push(records[i]);
    }
    part != [] ? this.updateRecordsReal(part, true) : void 0;
  }
  updateRecordsReal(part, f) {
    this.loadedTime = new Date();
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.open(
      this.settings.destructive ? "PUT" : "PATCH",
      `https://api.airtable.com/v0/${this.base}/${encodeURI(this.table)}`,
      true
    );
    xmlHttp.onload = function (e) {
      this.loadedTime = new Date();
      if (xmlHttp.response.error) {
        this.size = e.loaded;
        this.records = [];
        this.onerror(xmlHttp.response);
      } else {
        let r = xmlHttp.response;
        for (let i = 0; i < r.records.length; i++) {
          r.records[i].createdTime = new Date(r.records[i].createdTime);
        }
        this.size += e.loaded;
        this.records = this.records.concat(r.records);
        if (f) {
          this.part++;
          this.onprogress(xmlHttp.response, this.part, this.partNb);
          delete this.part;
          delete this.partNb;
          this.onload();
        } else {
          this.part++;
          this.onprogress(xmlHttp.response, this.part, this.partNb);
        }
      }
    }.bind(this);
    xmlHttp.setRequestHeader("Authorization", `Bearer ${this.key}`);
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.responseType = "json";
    xmlHttp.onerror = function (e) {
      this.loadedTime = new Date();
      this.size = e.loaded;
      this.records = [];
      delete this.part;
      delete this.partNb;
      this.onerror({
        error: {
          type: "NETWORK_ERROR",
          message: "Could not access to the network"
        }
      });
    }.bind(this);
    xmlHttp.send(
      JSON.stringify({
        records: part,
        typecast: this.settings?.typecast ? this.settings.typecast : false
      })
    );
  }
  
  deleteRecords(records) {
    this.settings.pageSize = this.settings.pageSize
      ? this.settings.pageSize
      : 10;
    this.size = 0;
    this.records = [];
    this.part = 0;
    this.partNb =
      Math.trunc(records.length / this.settings.pageSize) +
      Math.ceil(
        records.length / this.settings.pageSize -
          Math.trunc(records.length / this.settings.pageSize)
      );
    let part = [];
    for (let i = 0; i < records.length; i++) {
      if (part.length == this.settings.pageSize) {
        this.deleteRecordsReal(part, i == records.length);
        part = [];
      }
      part.push(records[i]);
    }
    part != [] ? this.deleteRecordsReal(part, true) : void 0;
  }
  deleteRecordsReal(part, f) {
    this.loadedTime = new Date();
    let query = []
    for (let i=0;i<part.length;i++) {
      query.push(`records[]=${part[i]}`)
    }
    
    let xmlHttp = new XMLHttpRequest();
    xmlHttp.open(
      "DELETE",
      `https://api.airtable.com/v0/${this.base}/${encodeURI(this.table)}?${query.join("&")}`,
      true
    );
    xmlHttp.onload = function (e) {
      this.loadedTime = new Date();
      if (xmlHttp.response.error) {
        this.size = e.loaded;
        this.records = [];
        this.onerror(xmlHttp.response);
      } else {
        this.size += e.loaded;
        this.records = this.records.concat(r.records);
        if (f) {
          this.part++;
          this.onprogress(xmlHttp.response, this.part, this.partNb);
          delete this.part;
          delete this.partNb;
          this.onload();
        } else {
          this.part++;
          this.onprogress(xmlHttp.response, this.part, this.partNb);
        }
      }
    }.bind(this);
    xmlHttp.setRequestHeader("Authorization", `Bearer ${this.key}`);
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.responseType = "json";
    xmlHttp.onerror = function (e) {
      this.loadedTime = new Date();
      this.size = e.loaded;
      this.records = [];
      delete this.part;
      delete this.partNb;
      this.onerror({
        error: {
          type: "NETWORK_ERROR",
          message: "Could not access to the network"
        }
      });
    }.bind(this);
    xmlHttp.send(
      JSON.stringify({
        records: part,
        typecast: this.settings?.typecast ? this.settings.typecast : false
      })
    );
  }
}
