import { Link, useLocation, NavLink } from "react-router-dom";
import "./style.css";
import SaveIcon from "../../assets/save.svg";
import Delete from "../../assets/delete.svg";

function Navigation() {
  const location = useLocation();
  
  // Extract category from current path
  const pathParts = location.pathname.split('/');
  const category = pathParts[1]; // e.g., "wtr", "rg", "temp", "dgu"
  // console.log("Current category:", category);
  
  const setPath = `/${category}/set`;
  const savePath = `/${category}/save`;

  return (
    <nav>
      <NavLink to={setPath}>
        <img src={SaveIcon} alt="Set measurements" width="30px" height="30px" />
      </NavLink>
      <NavLink to={savePath}>
        <img src={Delete} alt="View saved measurements" width="30px" height="30px" />
      </NavLink>
    </nav>
  );
}

export default Navigation;
