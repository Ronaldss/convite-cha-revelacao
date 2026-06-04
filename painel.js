const painelConfig = window.CONVITE_CONFIG || {};
const supabaseConfig = painelConfig.supabase || {};

const AUTH_STORAGE_KEY = "convite-admin-session";
const PAINEL_REDIRECT_FALLBACK = "https://convite-cha-revelacao.vercel.app/painel.html";

const ui = {
  authCard: document.getElementById("admin-auth-card"),
  dashboard: document.getElementById("admin-dashboard"),
  loginForm: document.getElementById("admin-login-form"),
  loginButton: document.getElementById("admin-login-button"),
  emailInput: document.getElementById("admin-email"),
  authFeedback: document.getElementById("admin-auth-feedback"),
  printButton: document.getElementById("admin-print-button"),
  logoutButton: document.getElementById("admin-logout-button"),
  totalGuests: document.getElementById("stat-total-guests"),
  confirmed: document.getElementById("stat-confirmed"),
  pending: document.getElementById("stat-pending"),
  totalVotes: document.getElementById("stat-total-votes"),
  girlVotes: document.getElementById("stat-girl-votes"),
  boyVotes: document.getElementById("stat-boy-votes"),
  confirmedRate: document.getElementById("stat-confirmed-rate"),
  girlRate: document.getElementById("stat-girl-rate"),
  boyRate: document.getElementById("stat-boy-rate"),
  presenceDonut: document.getElementById("presence-donut"),
  voteDonut: document.getElementById("vote-donut"),
  presenceDonutCenter: document.getElementById("presence-donut-center"),
  voteDonutCenter: document.getElementById("vote-donut-center"),
  presenceConfirmedLegend: document.getElementById("presence-confirmed-legend"),
  presencePendingLegend: document.getElementById("presence-pending-legend"),
  voteGirlLegend: document.getElementById("vote-girl-legend"),
  voteBoyLegend: document.getElementById("vote-boy-legend"),
  voteGirlBar: document.getElementById("vote-girl-bar"),
  voteBoyBar: document.getElementById("vote-boy-bar"),
  guestSearch: document.getElementById("guest-search"),
  attendanceFilter: document.getElementById("attendance-filter"),
  voteFilter: document.getElementById("vote-filter"),
  guestResultsNote: document.getElementById("guest-results-note"),
  guestList: document.getElementById("admin-guest-list"),
  activityList: document.getElementById("admin-activity-list"),
};

const state = {
  session: null,
  user: null,
  guests: [],
  votes: [],
  filters: {
    search: "",
    attendance: "all",
    vote: "all",
  },
};

bootstrap().catch((error) => {
  console.error("Falha ao iniciar o painel:", error);
  showAuthFeedback(
    "N\u00e3o foi poss\u00edvel iniciar o painel agora. Verifique a configura\u00e7\u00e3o e tente novamente.",
    true,
  );
});

async function bootstrap() {
  if (!isSupabaseConfigured()) {
    showAuthFeedback(
      "O painel precisa do Supabase configurado para funcionar.",
      true,
    );
    ui.loginButton.disabled = true;
    return;
  }

  bindEvents();
  hydrateSessionFromUrl();

  const session = await restoreSession();
  if (!session) {
    showLoggedOutState();
    return;
  }

  state.session = session;
  state.user = await fetchCurrentUser();
  await loadDashboard();
}

function bindEvents() {
  ui.loginForm?.addEventListener("submit", handleMagicLinkRequest);
  ui.printButton?.addEventListener("click", () => window.print());
  ui.logoutButton?.addEventListener("click", handleLogout);
  ui.guestSearch?.addEventListener("input", (event) => {
    state.filters.search = event.target.value.trim().toLowerCase();
    renderGuestList();
  });
  ui.attendanceFilter?.addEventListener("change", (event) => {
    state.filters.attendance = event.target.value;
    renderGuestList();
  });
  ui.voteFilter?.addEventListener("change", (event) => {
    state.filters.vote = event.target.value;
    renderGuestList();
  });
}

async function handleMagicLinkRequest(event) {
  event.preventDefault();
  const email = ui.emailInput?.value.trim().toLowerCase();
  if (!email) return;

  ui.loginButton.disabled = true;
  showAuthFeedback("Enviando link de acesso...", false);

  try {
    const response = await fetch(`${supabaseConfig.url}/auth/v1/otp`, {
      method: "POST",
      headers: {
        apikey: supabaseConfig.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        create_user: true,
        email_redirect_to: getPanelRedirectUrl(),
      }),
    });

    if (!response.ok) {
      throw new Error("Falha ao enviar magic link.");
    }

    showAuthFeedback(
      "Link enviado. Abra o e-mail no celular dos pais para entrar no painel.",
      false,
    );
  } catch (error) {
    console.error(error);
    showAuthFeedback(
      "N\u00e3o foi poss\u00edvel enviar o link agora. Verifique o e-mail e tente novamente.",
      true,
    );
  } finally {
    ui.loginButton.disabled = false;
  }
}

function hydrateSessionFromUrl() {
  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : "";
  if (!hash) return;

  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const expiresIn = Number(params.get("expires_in") || "0");

  if (!accessToken) return;

  const session = {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
  };

  saveSession(session);
  history.replaceState({}, document.title, window.location.pathname);
}

async function restoreSession() {
  const stored = readSession();
  if (!stored?.accessToken) return null;

  if (stored.expiresAt && stored.expiresAt > Date.now() + 30_000) {
    return stored;
  }

  if (!stored.refreshToken) {
    clearSession();
    return null;
  }

  try {
    const refreshed = await refreshSession(stored.refreshToken);
    saveSession(refreshed);
    return refreshed;
  } catch (error) {
    console.error(error);
    clearSession();
    return null;
  }
}

async function refreshSession(refreshToken) {
  const response = await fetch(
    `${supabaseConfig.url}/auth/v1/token?grant_type=refresh_token`,
    {
      method: "POST",
      headers: {
        apikey: supabaseConfig.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );

  if (!response.ok) {
    throw new Error("N\u00e3o foi poss\u00edvel renovar a sess\u00e3o.");
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token || refreshToken,
    expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000,
  };
}

async function fetchCurrentUser() {
  const response = await authFetch(`${supabaseConfig.url}/auth/v1/user`);
  const user = await response.json();
  if (!response.ok) {
    throw new Error("N\u00e3o foi poss\u00edvel carregar o usu\u00e1rio autenticado.");
  }
  return user;
}

async function loadDashboard() {
  showLoggedInState();
  showAuthFeedback("Carregando painel...", false);

  try {
    const [guests, votes] = await Promise.all([fetchGuests(), fetchVotes()]);
    state.guests = guests;
    state.votes = votes;
    renderDashboard();
    ui.authFeedback.hidden = true;
  } catch (error) {
    console.error(error);
    if (isAccessDenied(error)) {
      showAuthFeedback(
        "Este e-mail entrou, mas ainda n\u00e3o est\u00e1 autorizado para visualizar o painel. Adicione-o na tabela admin_users do Supabase.",
        true,
      );
    } else {
      showAuthFeedback(
        "N\u00e3o foi poss\u00edvel carregar os dados do painel agora.",
        true,
      );
    }
    showLoggedOutState();
  }
}

async function fetchGuests() {
  const response = await authFetch(
    `${supabaseConfig.url}/rest/v1/${supabaseConfig.guestsTable}?select=id,name,display_name,phone,invite_code,attendance_confirmed,created_at&order=display_name.asc.nullslast,name.asc`,
  );
  const data = await response.json();
  if (!response.ok) throw createAccessError(response.status, data);
  return Array.isArray(data) ? data : [];
}

async function fetchVotes() {
  const response = await authFetch(
    `${supabaseConfig.url}/rest/v1/${supabaseConfig.votesTable}?select=guest_id,guest_name,guest_display_name,vote,created_at&order=created_at.desc`,
  );
  const data = await response.json();
  if (!response.ok) throw createAccessError(response.status, data);
  return Array.isArray(data) ? data : [];
}

function renderDashboard() {
  const latestVotes = getLatestVotesByGuest(state.votes);
  const guestRows = buildGuestRows(state.guests, latestVotes);
  state.guestRows = guestRows;

  renderSummary(guestRows, latestVotes);
  renderGuestList();
  renderActivity(latestVotes);
}

function renderSummary(guestRows, latestVotes) {
  const totalGuests = guestRows.length;
  const confirmed = guestRows.filter((guest) => guest.attendanceConfirmed).length;
  const pending = totalGuests - confirmed;
  const totalVotes = latestVotes.length;
  const girlVotes = latestVotes.filter((vote) => vote.vote === "menina").length;
  const boyVotes = latestVotes.filter((vote) => vote.vote === "menino").length;

  setText(ui.totalGuests, totalGuests);
  setText(ui.confirmed, confirmed);
  setText(ui.pending, pending);
  setText(ui.totalVotes, totalVotes);
  setText(ui.girlVotes, girlVotes);
  setText(ui.boyVotes, boyVotes);
  setText(ui.confirmedRate, percentageText(confirmed, totalGuests));
  setText(ui.girlRate, percentageText(girlVotes, totalVotes));
  setText(ui.boyRate, percentageText(boyVotes, totalVotes));

  setText(ui.presenceConfirmedLegend, confirmed);
  setText(ui.presencePendingLegend, pending);
  setText(ui.voteGirlLegend, girlVotes);
  setText(ui.voteBoyLegend, boyVotes);
  setText(ui.presenceDonutCenter, percentageText(confirmed, totalGuests));
  setText(ui.voteDonutCenter, totalVotes);

  const confirmedAngle = percentageAngle(confirmed, totalGuests);
  const girlAngle = percentageAngle(girlVotes, totalVotes);
  ui.presenceDonut?.style.setProperty("--fill-angle", `${confirmedAngle}deg`);
  ui.voteDonut?.style.setProperty("--fill-angle", `${girlAngle}deg`);
  ui.voteGirlBar?.style.setProperty("width", `${percentageValue(girlVotes, totalVotes)}%`);
  ui.voteBoyBar?.style.setProperty("width", `${percentageValue(boyVotes, totalVotes)}%`);
}

function renderGuestList() {
  const filtered = applyGuestFilters(state.guestRows || []);
  ui.guestResultsNote.textContent = `${filtered.length} resultado${filtered.length === 1 ? "" : "s"}`;

  if (!filtered.length) {
    ui.guestList.innerHTML = `<div class="admin-empty">Nenhum convidado encontrado com os filtros atuais.</div>`;
    return;
  }

  ui.guestList.innerHTML = filtered
    .map((guest) => {
      const attendanceChip = guest.attendanceConfirmed
        ? `<span class="admin-chip admin-chip-confirmed">Presen&ccedil;a confirmada</span>`
        : `<span class="admin-chip admin-chip-pending">Presen&ccedil;a pendente</span>`;

      const voteChip = guest.vote
        ? `<span class="admin-chip ${guest.vote === "menina" ? "admin-chip-girl" : "admin-chip-boy"}">${guest.vote === "menina" ? "Palpite: Helena" : "Palpite: Heitor"}</span>`
        : `<span class="admin-chip admin-chip-empty">Ainda n&atilde;o votou</span>`;

      return `
        <article class="admin-guest-item">
          <div class="admin-guest-top">
            <div>
              <p class="admin-guest-name">${escapeHtml(guest.displayName)}</p>
              <p class="admin-guest-meta">${escapeHtml(formatGuestMeta(guest))}</p>
            </div>
          </div>
          <div class="admin-chip-row">
            ${attendanceChip}
            ${voteChip}
          </div>
        </article>
      `;
    })
    .join("");
}

function renderActivity(latestVotes) {
  const recent = latestVotes.slice(0, 8);
  if (!recent.length) {
    ui.activityList.innerHTML = `<div class="admin-empty">Ainda n&atilde;o h&aacute; palpites registrados.</div>`;
    return;
  }

  ui.activityList.innerHTML = recent
    .map((item) => {
      const chipClass = item.vote === "menina" ? "admin-chip-girl" : "admin-chip-boy";
      const label = item.vote === "menina" ? "Helena" : "Heitor";
      return `
        <article class="admin-activity-item">
          <div class="admin-activity-top">
            <div>
              <p class="admin-activity-name">${escapeHtml(item.name)}</p>
              <p class="admin-activity-meta">${escapeHtml(formatDateTime(item.createdAt))}</p>
            </div>
            <span class="admin-chip ${chipClass}">${label}</span>
          </div>
        </article>
      `;
    })
    .join("");
}

function applyGuestFilters(rows) {
  return rows.filter((guest) => {
    if (state.filters.search) {
      const searchable = `${guest.displayName} ${guest.phone}`.toLowerCase();
      if (!searchable.includes(state.filters.search)) return false;
    }

    if (state.filters.attendance === "confirmed" && !guest.attendanceConfirmed) return false;
    if (state.filters.attendance === "pending" && guest.attendanceConfirmed) return false;

    if (state.filters.vote === "voted" && !guest.vote) return false;
    if (state.filters.vote === "not_voted" && guest.vote) return false;
    if (state.filters.vote === "menina" && guest.vote !== "menina") return false;
    if (state.filters.vote === "menino" && guest.vote !== "menino") return false;

    return true;
  });
}

function buildGuestRows(guests, latestVotes) {
  const voteByGuestId = new Map();
  const voteByDisplayName = new Map();

  latestVotes.forEach((vote) => {
    if (vote.guestId) voteByGuestId.set(vote.guestId, vote);
    voteByDisplayName.set(vote.name, vote);
  });

  return guests.map((guest) => {
    const vote =
      voteByGuestId.get(guest.id) ||
      voteByDisplayName.get(guest.display_name || guest.name) ||
      voteByDisplayName.get(guest.name) ||
      null;

    return {
      id: guest.id,
      displayName: guest.display_name || guest.name,
      phone: guest.phone || "",
      inviteCode: guest.invite_code,
      attendanceConfirmed: Boolean(guest.attendance_confirmed),
      vote: vote?.vote || "",
      voteAt: vote?.createdAt || "",
    };
  });
}

function getLatestVotesByGuest(votes) {
  const map = new Map();

  votes.forEach((vote) => {
    const key = vote.guest_id || vote.guest_display_name || vote.guest_name;
    if (!key || map.has(key)) return;
    map.set(key, {
      guestId: vote.guest_id,
      name: vote.guest_display_name || vote.guest_name || "Convidado",
      vote: vote.vote,
      createdAt: vote.created_at,
    });
  });

  return [...map.values()];
}

async function authFetch(url, options = {}) {
  const session = state.session || (await restoreSession());
  if (!session?.accessToken) {
    throw new Error("Sessão administrativa indisponível.");
  }

  return fetch(url, {
    ...options,
    headers: {
      apikey: supabaseConfig.anonKey,
      Authorization: `Bearer ${session.accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
}

function handleLogout() {
  clearSession();
  state.session = null;
  state.user = null;
  state.guests = [];
  state.votes = [];
  showLoggedOutState();
  showAuthFeedback("Sessão encerrada.", false);
}

function showLoggedOutState() {
  ui.authCard.hidden = false;
  ui.dashboard.hidden = true;
  ui.printButton.hidden = true;
  ui.logoutButton.hidden = true;
}

function showLoggedInState() {
  ui.authCard.hidden = true;
  ui.dashboard.hidden = false;
  ui.printButton.hidden = false;
  ui.logoutButton.hidden = false;
}

function showAuthFeedback(message, isError) {
  if (!ui.authFeedback) return;
  ui.authFeedback.textContent = message;
  ui.authFeedback.hidden = false;
  ui.authFeedback.classList.toggle("is-error", Boolean(isError));
}

function saveSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function readSession() {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function getPanelRedirectUrl() {
  if (window.location.protocol.startsWith("http")) {
    return new URL("painel.html", window.location.href).toString();
  }
  return PAINEL_REDIRECT_FALLBACK;
}

function isSupabaseConfigured() {
  return Boolean(supabaseConfig.url && supabaseConfig.anonKey);
}

function createAccessError(status, payload) {
  const error = new Error(payload?.message || "Acesso negado.");
  error.status = status;
  return error;
}

function isAccessDenied(error) {
  return error?.status === 401 || error?.status === 403;
}

function percentageText(value, total) {
  return `${Math.round(percentageValue(value, total))}%`;
}

function percentageValue(value, total) {
  if (!total) return 0;
  return (value / total) * 100;
}

function percentageAngle(value, total) {
  if (!total) return 0;
  return Math.max(0, Math.min(360, (value / total) * 360));
}

function setText(node, value) {
  if (!node) return;
  node.textContent = String(value);
}

function formatGuestMeta(guest) {
  const phone = guest.phone || "telefone não informado";
  const invite = guest.inviteCode ? `convite ${guest.inviteCode.slice(-6)}` : "sem código";
  return `${phone} • ${invite}`;
}

function formatDateTime(value) {
  if (!value) return "sem horário";

  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
