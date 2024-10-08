import "moment/locale/es";
import moment from "moment-timezone";

moment.tz.setDefault("UTC"); // Cambiar a UTC
moment.locale("es");

export default moment;
