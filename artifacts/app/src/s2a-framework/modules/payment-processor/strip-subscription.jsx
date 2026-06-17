import * as React from "react";
import { useSearchParams } from "react-router-dom";
function Subscription() {
    let [searchParams] = useSearchParams();

    const customer_id = searchParams.get("customer_id");

    return (
        <>
            <div className="row">
                <div className="col-sm-6">
                    <div>
                        <h1>One Time</h1>
                    </div>
                    <stripe-pricing-table
                        pricing-table-id="prctbl_1NqAIcLc2Z1y2i5NAyqwlXO7"
                        client-reference-id={customer_id}
                        publishable-key="pk_test_51NkedFLc2Z1y2i5NoSrP0VIRNTCrpHNkRIecjkS3dhgO4Fi5s2ikhMmOhEPBOVjXCVf4F7lK0yX65tPyKOHeWtvS00viyDQsLD"></stripe-pricing-table>
                </div>
                <div className="col-sm-6">
                    <div>
                        <h1>Recurring</h1>
                    </div>
                    <stripe-pricing-table
                        pricing-table-id="prctbl_1Np3apLc2Z1y2i5NDYj4EqfP"
                        client-reference-id={customer_id}
                        publishable-key="pk_test_51NkedFLc2Z1y2i5NoSrP0VIRNTCrpHNkRIecjkS3dhgO4Fi5s2ikhMmOhEPBOVjXCVf4F7lK0yX65tPyKOHeWtvS00viyDQsLD"></stripe-pricing-table>
                </div>
            </div>
        </>
    );
}

export default Subscription;
