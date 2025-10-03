export default function parseData(section) {
    parsedData = null;

    type = getParameter(section, "type", "paragraph");
    metadata = getMetadata(section["metadata"]);
    transform = getTransform(section["transform"]);
    

}

function getParameter(obj, key, defaultValue) {
    return obj && obj.hasOwnProperty(key) ? obj[key] : defaultValue;
}

function getMetadata(data) {
    metadata = null;
    metadata["type"] = getParameter(data, "type", "paragraph");
    metadata["id"] = getParameter(data, "id", null);
    metadata["title"] = getParameter(data, "title", null);
    metadata["heading"] = getParameter(data, "heading", null);
    metadata["style"] = getParameter(data, "style", null);
    return metadata;
}

function getTransform(data) {
    transform = null;
    transform = getParameter(data, "width", 0);
    transform = getParameter(data, "height", 0);
    transform = getParameter(data, "offsetX", 0);
    transform = getParameter(data, "offsetY", 0);
    transform = getParameter(data, "rotateX", 0);
    transform = getParameter(data, "rotateY", 0);
    transform = getParameter(data, "rotateZ", 0);
    transform = getParameter(data, "position", "static");
    transform = getParameter(data, "zIndex", 0);
    return transform;
}