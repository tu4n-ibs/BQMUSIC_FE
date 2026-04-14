import { Routes, Route } from "react-router-dom";
import List from "../pages/common/List";
import Login from "../pages/auth/Login";
import UserMenu from "../pages/user/Profile";
import AdminMenu from "../pages/admin/Dashboard";
import UserHistory from "../pages/user/History";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import CreateUser from "../pages/admin/CreateUser";
import GenreManagement from "../pages/admin/GenreManagement";
import AlbumManagement from "../pages/admin/AlbumManagement";
import MyAlbums from "../pages/user/MyAlbums";
import AlbumDetail from "../pages/user/AlbumDetail";
import NewFeed from "../pages/user/Feed";
import Search from "../pages/user/Search";
import Playlists from "../pages/user/Playlists";
import Groups from "../pages/user/Groups";
import GroupDetail from "../pages/user/GroupDetail";
import TopSongs from "../pages/user/TopSongs";
import OAuth2RedirectHandler from "../pages/auth/OAuth2RedirectHandler";
import PrivateRoute from "./PrivateRoute";
import PublicRoute from "./PublicRoute";
import AdminLayout from "../components/layout/AdminLayout";
import SongManagement from "../pages/admin/SongManagement";

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
                
                {/* Admin Routes with AdminLayout */}
                <Route path="/admin" element={<AdminLayout><AdminMenu /></AdminLayout>} />
                <Route path="/admin/genres" element={<AdminLayout><GenreManagement /></AdminLayout>} />
                <Route path="/admin/songs" element={<AdminLayout><SongManagement /></AdminLayout>} />
                
                {/* User Routes */}
                <Route path="/my-albums" element={<MyAlbums />} />
                <Route path="/album/:albumId" element={<AlbumDetail />} />
                <Route path="/user/:userId" element={<UserMenu />} />
                <Route path="/user" element={<UserMenu />} />
                <Route path="/history" element={<UserHistory />} />
                <Route path="/newF" element={<NewFeed />} />
                <Route path="/posts/:postId" element={<NewFeed />} />
                <Route path="/search" element={<Search />} />
                <Route path="/playlists" element={<Playlists />} />
                <Route path="/top-songs" element={<TopSongs />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/groups/:groupId" element={<GroupDetail />} />
            </Route>
        </Routes>
    );
}

export default AppRoutes;
