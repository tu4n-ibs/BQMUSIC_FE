import { Routes, Route } from "react-router-dom";
import List from "../pages/common/List";
import Login from "../pages/auth/Login";
import UserMenu from "../pages/user/Profile";
import AdminMenu from "../pages/admin/Dashboard";
import History from "../pages/admin/History";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import CreateUser from "../pages/admin/CreateUser";
import GenreManagement from "../pages/admin/GenreManagement";
import AlbumManagement from "../pages/admin/AlbumManagement";
import NewFeed from "../pages/user/Feed";
import Search from "../pages/user/Search";
import Explore from "../pages/user/Explore";
import Messages from "../pages/user/Messages";
import Notifications from "../pages/user/Notifications";
import OAuth2RedirectHandler from "../pages/auth/OAuth2RedirectHandler";
import PrivateRoute from "./PrivateRoute";

function AppRoutes() {
    return (
        <Routes>
            {/* --- CÁC ROUTE CÔNG KHAI (KHÔNG CẦN LOGIN) --- */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/createUser" element={<CreateUser />} />
            {/* Route nhận callback từ Google */}
            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

            {/* --- CÁC ROUTE CẦN ĐĂNG NHẬP (PROTECTED ROUTES) --- */}
            {/* Bọc tất cả các route cần bảo vệ vào trong PrivateRoute */}
            <Route element={<PrivateRoute />}>

            </Route>
            <Route path="/list" element={<List />} />
            <Route path="/admin" element={<AdminMenu />} />
            <Route path="/admin/genres" element={<GenreManagement />} />
            <Route path="/admin/albums" element={<AlbumManagement />} />
            <Route path="/user/:userId" element={<UserMenu />} />
            <Route path="/user" element={<UserMenu />} />
            <Route path="/history" element={<History />} />
            <Route path="/newF" element={<NewFeed />} />
            <Route path="/search" element={<Search />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/notifications" element={<Notifications />} />
        </Routes>
    );
}

export default AppRoutes;
