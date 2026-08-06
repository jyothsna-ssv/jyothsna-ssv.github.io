(function () {
  const config = window.PORTFOLIO_CONFIG || {};
  const ownerEmail = config.ownerEmail || "karuparthi.jyothsna@gmail.com";
  const formspreeEndpoint = (config.formspreeEndpoint || "").trim();
  const form = document.getElementById("contactForm");

  function normalizeUrl(url) {
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    return `https://${url}`;
  }

  function setText(selector, value) {
    if (!value) return;
    document.querySelectorAll(selector).forEach((el) => {
      el.textContent = value;
    });
  }

  function setHeroName(fullName) {
    const heroName = document.querySelector('[data-profile="hero_name"]');
    if (!heroName || !fullName) return;
    heroName.textContent = fullName.trim();
  }

  function setMailto(email) {
    const targetEmail = email || ownerEmail;

    document.querySelectorAll("[data-profile-mailto]").forEach((el) => {
      el.href = `mailto:${targetEmail}`;
    });

    document.querySelectorAll("[data-profile-email-link]").forEach((el) => {
      el.href = `mailto:${targetEmail}`;
      el.textContent = targetEmail;
    });
  }

  function setFormAction(email) {
    if (!form) return;
    if (formspreeEndpoint) {
      form.action = formspreeEndpoint;
      form.method = "POST";
      return;
    }

    form.action = `mailto:${email || ownerEmail}`;
  }

  function applyProfile(profile) {
    if (!profile) {
      setMailto(ownerEmail);
      setFormAction(ownerEmail);
      return;
    }

    const fullName = profile.full_name || "Jyothsna Karuparthi";
    const titleRole = profile.title_role || "Software Engineer";
    const tagline = profile.tagline || "Building reliable software that turns ideas into usable, scalable products.";
    const email = profile.email || ownerEmail;

    document.title = `${fullName} | ${titleRole}`;
    document.querySelector('meta[name="title"]')?.setAttribute("content", `${fullName} | ${titleRole}`);
    document.querySelector('meta[name="description"]')?.setAttribute("content", `Portfolio of ${fullName}, ${titleRole}.`);
    document.querySelector('meta[name="author"]')?.setAttribute("content", fullName);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", `${fullName} | ${titleRole} Portfolio`);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", tagline);
    document.querySelector('meta[property="og:site_name"]')?.setAttribute("content", `${fullName} Portfolio`);
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", `${fullName} | Portfolio`);
    document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", profile.hero_roles || titleRole);

    setText(".brand", profile.short_name || fullName.split(" ")[0]);
    setText('[data-profile="hero_roles"]', profile.hero_roles);
    setText('[data-profile="tagline"]', profile.tagline);
    setText('[data-profile="location"]', profile.location);
    setText('[data-profile="full_name"]', fullName);
    setHeroName(fullName);
    setMailto(email);
    setFormAction(email);

    document.querySelectorAll('[data-profile-href="github_url"]').forEach((el) => {
      const url = normalizeUrl(profile.github_url);
      if (url) el.href = url;
    });

    document.querySelectorAll('[data-profile-href="linkedin_url"]').forEach((el) => {
      const url = normalizeUrl(profile.linkedin_url);
      if (url) el.href = url;
    });

    const resumeLink = document.getElementById("resumeLink");
    if (resumeLink && profile.resume_url) {
      resumeLink.href = profile.resume_url;
    }
  }

  async function loadProfile() {
    setFormAction(ownerEmail);

    if (!window.supabase || !config.supabaseUrl || !config.supabaseAnonKey) {
      return;
    }

    const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    const { data, error } = await client
      .from("portfolio_profile")
      .select("*")
      .eq("id", "main")
      .maybeSingle();

    if (error) {
      console.warn("Unable to load portfolio profile:", error.message);
      return;
    }

    applyProfile(data);
  }

  loadProfile();
})();
