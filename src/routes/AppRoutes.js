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
import Playlists from "../pages/user/Playlists";
import Groups from "../pages/user/Groups";
import MyGroups from "../pages/user/MyGroups";
import GroupDetail from "../pages/user/GroupDetail";
import OAuth2RedirectHandler from "../pages/auth/OAuth2RedirectHandler";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";

function AppRoutes() {
    return (
        <Routes>
            {/* --- PUBLIC ROUTES (NO LOGIN REQUIRED) --- */}
            {/* Authenticated users will be automatically redirected to Feed */}
            <Route element={<PublicRoute />}>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/createUser" element={<CreateUser />} />
            </Route>

            {/* Google OAuth2 callback route */}
            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

            {/* --- PROTECTED ROUTES (LOGIN REQUIRED) --- */}
            {/* All protected routes wrapped in PrivateRoute */}
            <Route element={<PrivateRoute />}>
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
                <Route path="/playlists" element={<Playlists />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/my-groups" element={<MyGroups />} />
                <Route path="/groups/:groupId" element={<GroupDetail />} />
            </Route>
        </Routes>
    );
}

export default AppRoutes;
