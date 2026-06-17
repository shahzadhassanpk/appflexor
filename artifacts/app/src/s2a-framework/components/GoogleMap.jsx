import Autocomplete from "react-google-autocomplete";

<Autocomplete
  apiKey={'AIzaSyB-snbnrO6bHyQo3DThE1Ha8dE3XRNbM1s'}
  onPlaceSelected={(place) => {
    console.log(place);
  }}
/>

export { Autocomplete }