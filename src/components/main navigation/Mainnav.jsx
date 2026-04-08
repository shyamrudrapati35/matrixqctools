import './style.css';
import { NavLink, Link } from 'react-router-dom';
import water from '../../assets/main_nav/water.svg';
import rg from '../../assets/main_nav/cutting.svg';
import temp from '../../assets/main_nav/temp.svg';
import dgu from '../../assets/main_nav/igu.svg';
// import igu from '../../assets/main_nav/igu_2.svg';

function Mainnav() {
    return (
        <nav className="mainnav">
            <NavLink to="/wtr/set"><img src={water} alt="water_logo" /></NavLink>
            <NavLink to="/rg/set"><img src={rg} alt="water_logo" /></NavLink>
            <NavLink to="/temp/set"><img src={temp} alt="water_logo" /></NavLink>
            <NavLink to="/dgu/set"><img src={dgu} alt="water_logo" /></NavLink>
        </nav>
    );
}

export default Mainnav;