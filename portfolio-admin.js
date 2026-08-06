(function () {
  const config = window.PORTFOLIO_CONFIG || {};
  const ownerEmail = config.ownerEmail || "karuparthi.jyothsna@gmail.com";

  if (!window.supabase || !config.supabaseUrl || !config.supabaseAnonKey) {
    document.getElementById("loginStatus").textContent = "Supabase is not configured.";
    return;
  }

  const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  const loginPanel = document.getElementById("loginPanel");
  const editorPanel = document.getElementById("editorPanel");
  const loginForm = document.getElementById("loginForm");
  const codeForm = document.getElementById("codeForm");
  const profileForm = document.getElementById("profileForm");
  const loginStatus = document.getElementById("loginStatus");
  const profileStatus = document.getElementById("profileStatus");
  const resumeStatus = document.getElementById("resumeStatus");
  const signOutButton = document.getElementById("signOutButton");
  let pendingEmail = ownerEmail;

  const defaults = {
    id: "main",
    full_name: "Jyothsna Karuparthi",
    short_name: "Jyothsna",
    title_role: "Software Engineer",
    hero_roles: "Software Engineer · Project Manager · Full-Stack Developer",
    tagline: "Building reliable software that turns ideas into usable, scalable products.",
    email: ownerEmail,
    github_url: "https://github.com/jyothsna-ssv",
    linkedin_url: "https://www.linkedin.com/in/karuparthi-jyothsna/",
    location: "Harrison, NJ, USA",
    resume_url: ""
  };

  function setStatus(el, message) {
    if (el) el.textContent = message || "";
  }

  function showEditor() {
    loginPanel.classList.add("admin-hidden");
    editorPanel.classList.remove("admin-hidden");
  }

  function showLogin() {
    editorPanel.classList.add("admin-hidden");
    loginPanel.classList.remove("admin-hidden");
  }

  function fillForm(profile) {
    const data = { ...defaults, ...(profile || {}) };
    Object.entries(data).forEach(([key, value]) => {
      const field = profileForm.elements[key];
      if (field) field.value = value || "";
    });
  }

  function collectProfile() {
    const formData = new FormData(profileForm);
    return {
      id: "main",
      full_name: formData.get("full_name")?.trim(),
      short_name: formData.get("short_name")?.trim(),
      title_role: formData.get("title_role")?.trim(),
      hero_roles: formData.get("hero_roles")?.trim(),
      tagline: formData.get("tagline")?.trim(),
      email: formData.get("email")?.trim(),
      github_url: formData.get("github_url")?.trim(),
      linkedin_url: formData.get("linkedin_url")?.trim(),
      location: formData.get("location")?.trim(),
      resume_url: formData.get("resume_url")?.trim(),
      updated_at: new Date().toISOString()
    };
  }

  async function requireOwnerSession() {
    const { data } = await client.auth.getSession();
    const session = data.session;
    const email = session?.user?.email;

    if (!session || email?.toLowerCase() !== ownerEmail.toLowerCase()) {
      if (session) await client.auth.signOut();
      showLogin();
      return null;
    }

    showEditor();
    return session;
  }

  async function loadProfile() {
    const { data, error } = await client
      .from("portfolio_profile")
      .select("*")
      .eq("id", "main")
      .maybeSingle();

    if (error) throw error;
    fillForm(data);
  }

  async function uploadResumeIfSelected() {
    const fileInput = document.getElementById("resumeFile");
    const file = fileInput.files?.[0];
    if (!file) return profileForm.elements.resume_url.value;

    if (file.type && file.type !== "application/pdf") {
      throw new Error("Please upload a PDF resume.");
    }

    setStatus(resumeStatus, "Uploading resume...");
    const filePath = "resume.pdf";
    const { error } = await client.storage
      .from("portfolio-files")
      .upload(filePath, file, {
        cacheControl: "3600",
        contentType: "application/pdf",
        upsert: true
      });

    if (error) throw error;

    const { data } = client.storage
      .from("portfolio-files")
      .getPublicUrl(filePath);

    fileInput.value = "";
    profileForm.elements.resume_url.value = data.publicUrl;
    setStatus(resumeStatus, "Resume uploaded.");
    return data.publicUrl;
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    pendingEmail = new FormData(loginForm).get("email")?.trim();

    if (pendingEmail.toLowerCase() !== ownerEmail.toLowerCase()) {
      setStatus(loginStatus, "Use the portfolio owner email address.");
      return;
    }

    setStatus(loginStatus, "Sending one-time code...");
    const { error } = await client.auth.signInWithOtp({
      email: pendingEmail,
      options: {
        emailRedirectTo: `${window.location.origin}${window.location.pathname}`
      }
    });

    if (error) {
      setStatus(loginStatus, error.message);
      return;
    }

    codeForm.classList.remove("admin-hidden");
    setStatus(loginStatus, "Check your email for the one-time code.");
  });

  codeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const token = new FormData(codeForm).get("code")?.trim();
    setStatus(loginStatus, "Verifying code...");

    const { error } = await client.auth.verifyOtp({
      email: pendingEmail,
      token,
      type: "email"
    });

    if (error) {
      setStatus(loginStatus, error.message);
      return;
    }

    setStatus(loginStatus, "");
    showEditor();
    await loadProfile();
  });

  profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(profileStatus, "Saving...");

    try {
      await uploadResumeIfSelected();
      const profile = collectProfile();
      const { error } = await client
        .from("portfolio_profile")
        .upsert(profile, { onConflict: "id" });

      if (error) throw error;
      setStatus(profileStatus, "Saved. Refresh the public site to see the latest changes.");
    } catch (error) {
      setStatus(profileStatus, error.message);
    }
  });

  signOutButton.addEventListener("click", async () => {
    await client.auth.signOut();
    showLogin();
  });

  requireOwnerSession()
    .then((session) => {
      if (session) return loadProfile();
      return null;
    })
    .catch((error) => {
      showLogin();
      setStatus(loginStatus, error.message);
    });
})();
