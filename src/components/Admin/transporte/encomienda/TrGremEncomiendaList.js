import GremPage from "./grem/GremPage";

// Mantiene estable la ruta historica /ad_transportegrem mientras la
// implementacion real vive separada en encomienda/grem.
export default function TrGremEncomiendaList() {
  return <GremPage />;
}
