/**
 * Class to map, translate or extract value for a single field defined by a mapping.
 *
 * ex: new FieldMapping("desc", "data.description.value", tc)
 */
export class FieldMapping {

    constructor(field, mapping, tc) {
        this.field = field;
        this.tc = tc;
        if (typeof mapping === "object") {
            this.path = mapping["path"];
            this.converter = game.babele.converters[mapping["converter"]];
            this.dynamic = true;
        } else {
            this.path = mapping;
            this.converter = null;
            this.dynamic = false;
        }
    }

    /**
     * Extract the
     *
     * @param data the original entity data to translate
     * @param translations the static available translations for the entity
     * @returns {{}} an object with expanded field path and a translated value.
     */
    map(data, translations) {
        const map = {};
        const value = this.translate(data, translations);
        if (value) {
            this.path.split('.').reduce((a, f, i, r) => {
                a[f] = (i < r.length - 1) ? {} : value;
                return a[f];
            }, map);
        }
        return map;
    }

    /**
     *
     * @param data
     * @param translations
     * @returns {*}
     */
    translate(data, translations) {
        const originalValue = this.extractValue(data);
        let value;
        if (this.converter && originalValue) {
            value = this.converter(originalValue, translations[this.field], data, this.tc, translations)
        } else {
            value = translations[this.field];
        }
        return value;
    }

    /**
     * Extracts the value corresponding to the field path configured within the passed data.
     *
     * ex:
     * const data = { "data": { "description": { "value": "bla bla" } } };
     * const value = new FieldMapping("desc", "data.description.value").extractValue(data);
     * console.log(value) // -> "bla bla"
     *
     * @param data
     * @returns {*}
     */
    extractValue(data) {
        return this.path.split('.').reduce((o, k) => {
            return o && o[k];
        }, data);
    }


    /**
     * Extract the value corresponding to the field path in object format.
     *
     * ex:
     * const data = { "data": { "description": { "value": "bla bla" } } };
     * const value = new FieldMapping("desc", "data.description.value").extractValue(data);
     * console.log(value) // -> { "desc": "bla bla" }
     *
     * @param data
     * @returns {*}
     */
    extract(data) {
        const extract = {};
        extract[this.field] = this.extractValue(data);
        return extract;
    }

    /**
     * If this field mapping is based on a converter.
     *
     * @returns {boolean} true if is based on a converter.
     */
    isDynamic() {
        return this.dynamic;
    }
}