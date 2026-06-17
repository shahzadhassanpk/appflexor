import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../../AppContext';

function ModuleListSort({ data = [], handleData, showName = false ,showPrice = false ,showRating = false }) {
    // const [data, setData] = useState([{ name: "hamza", price: 34, rating: 8 }, { name: "abrar", price: 3, rating: 5 }, { name: "zaryab", price: 76, rating: 18 }, { name: "talha", price: 20, rating: 9 }])
    const appContext = useContext(AppContext);
    const [sortName, setSortName] = useState("default");
    const [sortPrice, setSortPrice] = useState("default");
    const [sortRating, setSortRating] = useState("default");
    const [sorted, setSorted] = useState([]);
    let width = appContext.width;
    let _data = [];

    if (data === undefined) {
        _data = [];
    } else {
        _data = [...data];
    }

    useEffect(() => {
        setSorted(_data);
    }, [data]);

    function onSortChange() {

        const _currentSort = sortName;
        let nextSort;
        if (_currentSort === "down") nextSort = "up";
        else if (_currentSort === "up") nextSort = "default";
        else if (_currentSort === "default") nextSort = "down";
        setSortName(nextSort);
        let result = _data.sort(sortTypeName[nextSort].fn);
        setSorted(result);
        handleData(result);
        console.table(_data.sort(sortTypeName[nextSort].fn));
    }
    function onSortPrice() {
        let _data = [...data];
        const _currentSort = sortPrice;
        let nextSort;
        if (_currentSort === "down") nextSort = "up";
        else if (_currentSort === "up") nextSort = "default";
        else if (_currentSort === "default") nextSort = "down";
        setSortPrice(nextSort);
        let result = _data.sort(sortTypePrice[nextSort].fn);
        setSorted(result);
        handleData(result);

        console.table(_data.sort(sortTypePrice[nextSort].fn));
    }
    function onSortRating() {
        let _data = [...data];
        const _currentSort = sortRating;
        let nextSort;
        if (_currentSort === "down") nextSort = "up";
        else if (_currentSort === "up") nextSort = "default";
        else if (_currentSort === "default") nextSort = "down";
        setSortRating(nextSort);
        let result = _data.sort(sortTypeRating[nextSort].fn);
        setSorted(result);
        handleData(result);
        console.table(_data.sort(sortTypeRating[nextSort].fn));
    }
    const sortTypeName = {
        up: {
            className: "sort-up",
            fn: (a, b) => {

                {
                    const nameA = a.name.toUpperCase(); // ignore upper and lowercase
                    const nameB = b.name.toUpperCase(); // ignore upper and lowercase
                    if (nameA < nameB) {
                        return -1;
                    }
                    if (nameA > nameB) {
                        return 1;
                    }
                    return 0;
                }
            },
        },
        down: {
            className: "sort-down",
            fn: (a, b) => {

                {
                    const nameA = a.name.toLowerCase().trim(); // ignore upper and lowercase
                    const nameB = b.name.toLowerCase().trim(); // ignore upper and lowercase
                    if (nameA > nameB) {  
                        return -1;
                    }

                    if (nameA < nameB) {
                        return 1;
                    }
                    return 0;
                }
            },
        },
        default: {
            className: "sort",
            fn: (a, b) => a.name,
        },
    };
    const sortTypePrice = {
        up: {
            className: "sort-up",
            fn: (a, b) => a.single - b.single,
        },
        down: {
            className: "sort-down",
            fn: (a, b) => b.single - a.single,
        },
        default: {
            className: "sort",
            fn: (a, b) => a.single,
        },
    };
    const sortTypeRating = {
        up: {
            className: "sort-up",
            fn: (a, b) => a.rating - b.rating,
        },
        down: {
            className: "sort-down",
            fn: (a, b) => b.rating - a.rating,
        },
        default: {
            className: "sort",
            fn: (a, b) => a.rating,
        },
    };


    return (
        <div className={`row shadow-box bg-white ${width === 'desktop' ? 'p-3 my-2 mx-2' : 'p-3 ms-2 mb-2 mt-0 pe-1'}`}>
            <div className="col-sm-2 d-flex align-items-center">
                <span className=''>Sort Result by:</span>
            </div>
            <div className="col-sm-7">
                <ul className="d-flex justify-content-start mt-2 mb-2 ps-0">
                {showName &&    <li className="sort-type-header me-2" >
                        <span className="px-2"> Name</span>
                        {/* <button className="btn-sort active" ><i className="fa fa-sort text-white"></i></button> */}
                        <button
                            type="button"
                            className="btn btn-light"
                            onClick={onSortChange}
                        >
                            <i className={`fas fa-${sortTypeName[sortName].className}`} ></i>
                        </button>
                    </li>}
                    {showPrice && <li className="sort-type-header me-2" >
                        <span className="px-2"> Price</span>
                        {/* <button className="btn-sort" ><i className="fa fa-sort text-white"></i></button> */}
                        <button type="button" className="btn btn-light"
                            onClick={onSortPrice}
                        >
                            <i className={`fas fa-${sortTypePrice[sortPrice].className}`}></i>
                        </button>
                    </li>}
                   {showRating && <li className="sort-type-header me-2" >
                        <span className="px-2"> Rating</span>
                        {/* <button className="btn-sort" ><i className="fa fa-sort text-white"></i></button> */}
                        <button type="button" className="btn btn-light"
                            onClick={onSortRating}
                        >
                            <i className={`fas fa-${sortTypeRating[sortRating].className}`}></i>
                        </button>
                    </li>}
                </ul>

            </div>
            {
                width === 'desktop' ? <div className="col-sm-3">
                    <button className={`btn-grid m-2 p-2 ${width === 'desktop' ? 'float-end' : 'float-start'} `} >
                        <i className="fas fa-th"></i>
                    </button>
                    <button className={`btn-grid m-2 p-2 ${width === 'desktop' ? 'float-end' : 'float-start'} `} >
                        <i className="fas fa-th-large"></i>
                    </button>
                    <button className={`btn-grid m-2 p-2 ${width === 'desktop' ? 'float-end' : 'float-start'} active`} >
                        <i className="fas fa-bars"></i>
                    </button>
                </div> : null
            }
        </div>
    );
}

export default ModuleListSort;