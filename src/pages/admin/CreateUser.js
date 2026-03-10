import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";

import "bootstrap/dist/css/bootstrap.min.css";
import "./css/Block.css"; // Reuse modern styles

function CreateUser() {
  const [form, setForm] = useState({
    name: "",
    password: "",
    email: "",
    roles: []
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleRoleChange = (role) => {
    let newRoles = [...form.roles];
    if (newRoles.includes(role)) {
      newRoles = newRoles.filter((r) => r !== role);
    } else {
      newRoles.push(role);
    }
    setForm({ ...form, roles: newRoles });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData();
      const userData = {
        name: form.name,
        password: form.password,
        email: form.email,
        roles: form.roles // Default to USER if empty? Depends on backend.
      };

      formData.append(
        "user",
        new Blob([JSON.stringify(userData)], { type: "application/json" })
      );
      if (image) formData.append("image", image);

      const token = localStorage.getItem("token");

      await axios.post("${process.env.REACT_APP_API_BASE_URL}/api/v1/user", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("✨ User created successfully!");
      navigate("/admin");
    } catch (err) {
      console.error(err);
      toast.error("❌ Error creating user! Please check again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-container">

      <div className="container mt-4">
        {/* Simple Back Breadcrumb */}
        <div className="mb-4">
          <button onClick={() => navigate('/admin')} className="btn btn-link text-decoration-none ps-0 text-muted fw-bold">
            <i className="bi bi-arrow-left me-2"></i>Back to Dashboard
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="row justify-content-center">

            {/* Left Column: Avatar & Basic Info */}
            <div className="col-lg-4 mb-4">
              <div className="main-card p-4 text-center h-100">
                <h5 className="fw-bold mb-4 text-start">Profile Picture</h5>

                <label className="avatar-upload-area">
                  <input type="file" onChange={handleFileChange} hidden accept="image/*" />
                  {preview ? (
                    <img src={preview} alt="Preview" className="avatar-preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <i className="bi bi-camera"></i>
                      <span className="small fw-bold">Upload Photo</span>
                    </div>
                  )}
                </label>
                <p className="text-muted small mb-4">Allowed *.jpeg, *.jpg, *.png, *.gif</p>

                <div className="text-start">
                  <label className="form-label">Full Name</label>
                  <div className="input-icon-wrapper mb-3">
                    <i className="bi bi-person input-icon"></i>
                    <input
                      type="text"
                      name="name"
                      className="form-control-modern with-icon"
                      placeholder="e.g. John Doe"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Account Details */}
            <div className="col-lg-8 mb-4">
              <div className="main-card p-4 h-100">
                <h5 className="fw-bold mb-4">Account Details</h5>

                <div className="row">
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Email Address</label>
                    <div className="input-icon-wrapper">
                      <i className="bi bi-envelope input-icon"></i>
                      <input
                        type="email"
                        name="email"
                        className="form-control-modern with-icon"
                        placeholder="john@example.com"
                        value={form.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-12 mb-3">
                    <label className="form-label">Password</label>
                    <div className="input-icon-wrapper">
                      <i className="bi bi-lock input-icon"></i>
                      <input
                        type="password"
                        name="password"
                        className="form-control-modern with-icon"
                        placeholder="Set a strong password"
                        value={form.password}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="col-md-12 mb-4">
                    <label className="form-label d-block mb-3">Assign Roles</label>
                    <div className="role-checkbox-group">
                      <label className={`role-option ${form.roles.includes('ADMIN') ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          hidden
                          checked={form.roles.includes('ADMIN')}
                          onChange={() => handleRoleChange('ADMIN')}
                        />
                        <i className={`bi bi-${form.roles.includes('ADMIN') ? 'check-circle-fill' : 'circle'} text-primary me-1`}></i>
                        <span>ADMIN</span>
                      </label>

                      <label className={`role-option ${form.roles.includes('USER') ? 'checked' : ''}`}>
                        <input
                          type="checkbox"
                          hidden
                          checked={form.roles.includes('USER')}
                          onChange={() => handleRoleChange('USER')}
                        />
                        <i className={`bi bi-${form.roles.includes('USER') ? 'check-circle-fill' : 'circle'} text-primary me-1`}></i>
                        <span>USER</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-3 pt-3 border-top mt-2">
                  <button
                    type="button"
                    className="btn-secondary-modern"
                    onClick={() => navigate('/admin')}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary-modern"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : 'Create User'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </form>
      </div>

      {/* <Footer /> */}
    </div>
  );
}

export default CreateUser;
