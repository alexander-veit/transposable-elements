import React from "react";
import CircularProgress from "react-cssfx-loading/lib/CircularProgress";
import { TabixIndexedFile } from "@gmod/tabix";
import VCF from "@gmod/vcf";
import { RemoteFile } from "generic-filehandle";
//import fetch from 'node-fetch'
import { CHROMS } from "./chrom-utils";
import { format } from "d3-format";
import { VCF_URL, TBI_URL, vcfRecordToJson, parseLocation } from "./data-utils";

const PAGE_SIZE = 50;

class VariantTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showFilter: false,
      loading: true,
      variants: [],
      displayedVariants: [],
      tablePage: 0,
      filter: {}
    };
    this.variants = [];
    this.loadingVariantsCalled = false;
  }

  componentDidMount() {
    this.nextPage = this.nextPage.bind(this);
    this.previousPage = this.previousPage.bind(this);
    this.toggleFilter = this.toggleFilter.bind(this);
    this.filterChange = this.filterChange.bind(this);
    this.toggleDetails = this.toggleDetails.bind(this);
    this.loadVariants();
  }

  nextPage() {
    this.setState((prevState) => ({
      tablePage: prevState.tablePage + 1
    }));
  }

  previousPage() {
    this.setState((prevState) => ({
      tablePage: prevState.tablePage - 1
    }));
  }

  toggleFilter() {
    this.setState((prevState) => ({
      showFilter: !prevState.showFilter
    }));
  }

  toggleDetails(event) {
    event.preventDefault();
    const variantId = event.target.dataset.id;
    const variants = this.state.displayedVariants;
    variants.forEach(v => {
      if(v["id"] === variantId){
        v["showDetails"] = !v["showDetails"];
      }
    })

    this.setState((prevState) => ({
      displayedVariants: variants
    }));
  }

  filterChange(event) {
    const filtertype = event.target.dataset.filtertype;
    const filter = this.state.filter;
    
    filter[filtertype] = event.target.value;
    if(event.target.value == ""){
      delete filter[filtertype];
    }
    this.applyFilter(filter);
  }

  applyFilter(filter){
    let variants = this.state.variants;
    if(filter["id"] !== undefined){
      variants = variants.filter(v => v["id"].includes(filter["id"]));
    }
    if(filter["from"] !== undefined){
      const locFrom = parseLocation(filter["from"]);
      if(locFrom){
        variants = variants.filter(v => {
          return v["posAbs"] >= locFrom["posAbs"];
        });
      }
    }
    if(filter["to"] !== undefined){
      const locTo = parseLocation(filter["to"]);
      if(locTo){
        variants = variants.filter(v => {
          return v["posAbs"] <= locTo["posAbs"];
        });
      }
    }

    this.setState((prevState) => ({
      filter: filter,
      displayedVariants: variants
    }));

  }

  loadVariants() {
    if (this.loadingVariantsCalled) {
      return;
    }
    this.loadingVariantsCalled = true;

    this.vcfFile = new TabixIndexedFile({
      filehandle: new RemoteFile(VCF_URL),
      tbiFilehandle: new RemoteFile(TBI_URL),
    });
    const vcfHeader = this.vcfFile.getHeader(); // Promise

    vcfHeader.then((header) => {
      const tbiVCFParser = new VCF({ header: header });
      const dataPromises = [];
      CHROMS.forEach((chrom) => {
        const dataPromise = this.vcfFile.getLines(
          chrom["name"],
          0,
          chrom["length"],
          (line) => {
            const vcfRecord = tbiVCFParser.parseLine(line);
            //console.log(vcfRecord);
            this.variants.push(vcfRecordToJson(vcfRecord, chrom));
          }
        );
        dataPromises.push(dataPromise);
      });

      Promise.all(dataPromises).then((values) => {
        this.setState((prevState) => ({
          loading: false,
          variants: this.variants,
          displayedVariants: this.variants,
        }));
        //console.log(this.variants);
      });
    });
  }

  render() {
    if (this.state.loading) {
      return (
        <div className="text-center">
          <CircularProgress color="#999999" width="50px" height="50px" />
          <div className="mt-2 small text-muted">Loading variants...</div>
        </div>
      );
    }

    const variantRows = [];
    const variantsToDisplay = this.state.displayedVariants.sort((a, b) => a.order - b.order);
    const variantsToDisplaySliced = variantsToDisplay.slice(
      this.state.tablePage * PAGE_SIZE,
      (this.state.tablePage+1) * PAGE_SIZE
    );

    variantsToDisplaySliced.forEach((variant, index) => {
      variantRows.push(
        <tr className={variant.showDetails ? "table-secondary": ""}>
          <td>{variant.id}</td>
          <td>{variant.chrom}</td>
          <td>{format(",.0f")(variant.start)}</td>
          <td>{format(",.0f")(variant.end)}</td>
          <td>{variant.length}</td>
          <td>{variant.type}</td>
          <td><a href="#" className="link-primary" data-id={variant.id} onClick={this.toggleDetails}>Details</a></td>
        </tr>
      );
      if(variant.showDetails){

        const infos = [];
        for (const property in variant.info) {
          infos.push(
            <div className="col-md-4"><strong>{property}:</strong> {variant.info[property]}</div>
          );
        }

        variantRows.push(
          <tr className="table-light">
            <td colSpan={7}>
              <div className="row">
                {infos}
              </div>
            </td>
          </tr>
        );
      }
    });

    const navButtons = [];
    if (this.state.tablePage > 0) {
      navButtons.push(
        <button
          className="btn btn-primary btn-sm mx-2"
          onClick={this.previousPage}
        >
          Previous
        </button>
      );
    }

    if (
      variantsToDisplay.length > PAGE_SIZE &&
      (this.state.tablePage+1) * PAGE_SIZE <= variantsToDisplay.length
    ) {
      navButtons.push(
        <button className="btn btn-primary btn-sm" onClick={this.nextPage}>
          Next
        </button>
      );
    }

    let message = "No variants found";
    if(variantsToDisplay.length > 0){
      message = `Displaying variants ${this.state.tablePage * PAGE_SIZE + 1}-${Math.min((this.state.tablePage + 1) * PAGE_SIZE, variantsToDisplay.length)} of ${variantsToDisplay.length}`
    }
    

    return (
      <div>
        <div className="d-flex mb-2">
          <div className="me-auto"></div>
          <button
            className="btn btn-primary me-auto btn-sm collapse"
            onClick={this.toggleFilter}
          >
            Filter
          </button>
          
          <div className="pt-1 mx-2">
            {message}
          </div>
          {navButtons}
        </div>

        {/* <div className={this.state.showFilter ? "" : "collapse"}>
          <div className="my-3 p-3 bg-light">
ss
          </div>
        </div> */}
        <div className="row pb-5">
          <div className="col-md-2">
            <div className="small pt-1 text-muted">
            FILTER
            </div>
            <div className="mt-1 p-3 bg-light">
              <div className="mb-2">
                <label htmlFor="filter-id" className="form-label small">ID</label>
                <input className="form-control form-control-sm" id="filter-id" data-filtertype="id" onChange={this.filterChange} />
              </div>
              <div className="mb-2">
                <label htmlFor="filter-from" className="form-label small">From</label>
                <input className="form-control form-control-sm" id="filter-from" placeholder="e.g. chr1:1000000" data-filtertype="from" onChange={this.filterChange} />
              </div>
              <div className="mb-2">
                <label htmlFor="filter-to" className="form-label small">To</label>
                <input className="form-control form-control-sm" id="filter-to" placeholder="e.g. chr3:20000000"  data-filtertype="to" onChange={this.filterChange} />
              </div>

            </div>
          </div>
          <div className="col-md-10">
            <table className="table table-hover table-sm">
              <thead className="sticky-table-header bg-white">
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Chomosome</th>
                  <th scope="col">Start</th>
                  <th scope="col">End</th>
                  <th scope="col">Length</th>
                  <th scope="col">SV type</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>{variantRows}</tbody>
            </table>
          </div>
        </div>
       
      </div>
    );
  }
}

export default VariantTable;
