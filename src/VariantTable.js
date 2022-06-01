import React from "react";
import CircularProgress from "react-cssfx-loading/lib/CircularProgress";

class VariantTable extends React.Component{

  constructor(props) {
    super(props);
    this.state = {
      showFilter: false,
      loading: true
    };
    this.toggleFilter = this.toggleFilter.bind(this);
    this.loadVariants()
  }

  toggleFilter() {
    this.setState(prevState => ({
      showFilter: !prevState.showFilter
    }));
  }

  loadVariants(){
    setTimeout(() => {  
      this.setState(prevState => ({
        loading: false
      }));
     }, 5000);
  }

  render() {
    if(this.state.loading){
      return (
        <div className='text-center'>
          <CircularProgress color="#999999" width="50px" height="50px" />
          <div className='mt-2 small text-muted'>Loading variants...</div>
        </div>
      );
    }

    return (
      <div>
        <div className="d-flex flex-row-reverse">
          <button className="btn btn-primary align-right" onClick={this.toggleFilter}>Filter</button>
          </div>
        <table className="table table-striped table-hover table-sm">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">First</th>
              <th scope="col">Last</th>
              <th scope="col">Handle</th>
            </tr>
            
            <tr className={this.state.showFilter ? '' : 'collapse'}>
              <th scope="col">#</th>
              <th scope="col">First</th>
              <th scope="col">Last</th>
              <th scope="col">Handle</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">1</th>
              <td>Mark</td>
              <td>Otto</td>
              <td>@mdo</td>
            </tr>
            <tr>
              <th scope="row">2</th>
              <td>Jacob</td>
              <td>Thornton</td>
              <td>@fat</td>
            </tr>
            <tr>
              <th scope="row">3</th>
              <td colspan="2">Larry the Bird</td>
              <td>@twitter</td>
            </tr>
          </tbody>
        </table>
      </div>
      
    );
  }

}

export default VariantTable;
