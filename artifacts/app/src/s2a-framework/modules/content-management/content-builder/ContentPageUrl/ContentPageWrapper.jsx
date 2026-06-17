import ContentPageUrl from "./ContentPageUrl";

const ContentPageUrlWrapper = () => {
    const url = window.location.href.split("id=")[1];

    return <ContentPageUrl _id={url} />;
};

export default ContentPageUrlWrapper;
