.PHONY: help install dev dev\:web dev\:astro dev\:api dev\:share dev\:email build build\:web build\:astro build\:api build\:share lint lint\:fix format format\:check typecheck test test\:watch test\:api check fix clean clean\:all clean\:deep reset preview\:astro update env\:setup env\:check db\:generate db\:generate\:production db\:migrate db\:migrate\:production db\:push db\:push\:production db\:studio db\:studio\:production trigger\:login trigger\:whoami trigger\:dev trigger\:deploy trigger\:deploy\:production storybook\:recorder storybook\:recorder\:build assets\:upload assets\:upload\:production assets\:upload\:dry-run assets\:manifest tunnel\:start tunnel\:stop tunnel\:status sdk\:build sdk\:build\:npm sdk\:build\:cdn sdk\:build\:npm\:obfuscate sdk\:build\:cdn\:obfuscate metadata\:build metadata\:build\:npm metadata\:build\:cdn embed\:build embed\:build\:cdn embed\:build\:cdn\:dev embed\:build\:cdn\:production embed\:upload embed\:upload\:production embed\:upload\:dry-run embed\:deploy embed\:deploy\:production i d b l f t c
.DEFAULT_GOAL := help

# Colors
CYAN := \033[0;36m
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
MAGENTA := \033[0;35m
WHITE := \033[1;37m
RESET := \033[0m

help: ## Show this help message
	@echo "$(CYAN)"
	@echo "╔══════════════════════════════════════════════════════════════════════╗"
	@echo "║                                                                      ║"
	@echo "║         ▗▖ ▗▖ ▗▄▄▖▗▄▄▄▖▗▄▄▖ ▗▄▄▖ ▗▖    ▗▄▖ ▗▖  ▗▖▗▄▄▄▖               ║"
	@echo "║         ▐▌ ▐▌▐▌   ▐▌   ▐▌ ▐▌▐▌ ▐▌▐▌   ▐▌ ▐▌▐▛▚▖▐▌▐▌                  ║"
	@echo "║         ▐▌ ▐▌ ▝▀▚▖▐▛▀▀▘▐▛▀▚▖▐▛▀▘ ▐▌   ▐▛▀▜▌▐▌ ▝▜▌▐▛▀▀▘               ║"
	@echo "║         ▝▚▄▞▘▗▄▄▞▘▐▙▄▄▖▐▌ ▐▌▐▌   ▐▙▄▄▖▐▌ ▐▌▐▌  ▐▌▐▙▄▄▖               ║"
	@echo "║                                                                      ║"
	@echo "║                                                                      ║"
	@echo "╚══════════════════════════════════════════════════════════════════════╝"
	@echo "$(RESET)"
	@echo ""
	@echo "$(WHITE)╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(WHITE)║                                   Available Commands                                              ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ Command                       ║ Description                                                       ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)SETUP$(WHITE)                                                                                             ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)install$(WHITE)                       ║$(RESET) Install all dependencies                                          $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)update$(WHITE)                        ║$(RESET) Update dependencies                                               $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)env:setup$(WHITE)                     ║$(RESET) Copy .env.example files to create .env.development files         $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)env:check$(WHITE)                     ║$(RESET) Check if .env.development files exist                             $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)DATABASE$(WHITE)                                                                                          ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:generate$(WHITE)                   ║$(RESET) Generate migrations (dev)                                         $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:generate:production$(WHITE)        ║$(RESET) Generate migrations (production)                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:migrate$(WHITE)                    ║$(RESET) Run migrations (dev)                                              $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:migrate:production$(WHITE)         ║$(RESET) Run migrations (production)                                       $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:push$(WHITE)                       ║$(RESET) Push schema directly (dev)                                        $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:push:production$(WHITE)            ║$(RESET) Push schema directly (production)                                 $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:studio$(WHITE)                     ║$(RESET) Open Drizzle Studio (dev)                                         $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:studio:production$(WHITE)          ║$(RESET) Open Drizzle Studio (production)                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)DEVELOPMENT$(WHITE)                                                                                       ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev$(WHITE)                           ║$(RESET) Run all apps in development mode                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:web$(WHITE)                       ║$(RESET) Run web app only                                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:astro$(WHITE)                     ║$(RESET) Run astro app only                                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:api$(WHITE)                       ║$(RESET) Run API only                                                      $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:share$(WHITE)                     ║$(RESET) Run Share URL shortener only                                      $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:email$(WHITE)                     ║$(RESET) Run Email preview server only                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:playground$(WHITE)                ║$(RESET) Run playground app only                                           $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)BUILD$(WHITE)                                                                                             ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build$(WHITE)                         ║$(RESET) Build all apps                                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build:web$(WHITE)                     ║$(RESET) Build web app only                                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build:astro$(WHITE)                   ║$(RESET) Build astro app only                                              $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build:api$(WHITE)                     ║$(RESET) Build API only                                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build:share$(WHITE)                   ║$(RESET) Build Share URL shortener only                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)preview:astro$(WHITE)                 ║$(RESET) Preview astro production build                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)CODE QUALITY$(WHITE)                                                                                      ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)lint$(WHITE)                          ║$(RESET) Run linter                                                        $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)lint:fix$(WHITE)                      ║$(RESET) Run linter and fix issues                                         $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)format$(WHITE)                        ║$(RESET) Format all files                                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)format:check$(WHITE)                  ║$(RESET) Check formatting                                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)typecheck$(WHITE)                     ║$(RESET) Type check all packages                                           $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)fix$(WHITE)                           ║$(RESET) Fix all issues (lint + format)                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)check$(WHITE)                         ║$(RESET) Run all checks (lint + type + format)                             $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)TESTING$(WHITE)                                                                                           ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)test$(WHITE)                          ║$(RESET) Run all tests                                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)test:watch$(WHITE)                    ║$(RESET) Run tests in watch mode                                           $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)test:api$(WHITE)                      ║$(RESET) Test API endpoints                                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)STORYBOOK$(WHITE)                                                                                         ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:recorder$(WHITE)            ║$(RESET) Run Storybook for recorder app                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:recorder:build$(WHITE)      ║$(RESET) Build Storybook for recorder app                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:postbridge$(WHITE)          ║$(RESET) Run Storybook for postbridge package                              $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:postbridge:build$(WHITE)    ║$(RESET) Build Storybook for postbridge package                            $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)ASSETS (CDN)$(WHITE)                                                                                     ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)assets:upload$(WHITE)                 ║$(RESET) Upload assets to R2 CDN (dev)                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)assets:upload:production$(WHITE)      ║$(RESET) Upload assets to R2 CDN (production)                              $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)assets:upload:dry-run$(WHITE)         ║$(RESET) Preview what would be uploaded (dev)                              $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)assets:manifest$(WHITE)               ║$(RESET) Generate asset manifest only (no upload)                          $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)TUNNELS (Cloudflare Tunnel)$(WHITE)                                                                      ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)tunnel:start$(WHITE)                  ║$(RESET) Start Cloudflare tunnel (all services)                             $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)tunnel:stop$(WHITE)                   ║$(RESET) Stop Cloudflare tunnel                                             $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)tunnel:status$(WHITE)                 ║$(RESET) Show tunnel status and URLs                                        $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)BACKGROUND JOBS (Inngest)$(WHITE)                                                                        ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)inngest:dev$(WHITE)                   ║$(RESET) Run Inngest dev server (localhost:8288)                            $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)SDK PACKAGE$(WHITE)                                                                                        ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)sdk:build$(WHITE)                     ║$(RESET) Build SDK (standard dev build)                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)sdk:build:npm$(WHITE)                 ║$(RESET) Build SDK (size-optimized for npm)                                 $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)sdk:build:cdn$(WHITE)                 ║$(RESET) Build SDK (size-optimized for CDN)                                 $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)sdk:build:npm:obfuscate$(WHITE)       ║$(RESET) Build SDK (obfuscated for npm)                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)sdk:build:cdn:obfuscate$(WHITE)       ║$(RESET) Build SDK (obfuscated for CDN)                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)METADATA PACKAGE$(WHITE)                                                                                   ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)metadata:build$(WHITE)                ║$(RESET) Build Metadata (standard dev build)                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)metadata:build:npm$(WHITE)            ║$(RESET) Build Metadata (size-optimized for npm)                            $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)metadata:build:cdn$(WHITE)            ║$(RESET) Build Metadata (size-optimized for CDN)                            $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)EMBED PACKAGE (CDN)$(WHITE)                                                                                ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)embed:build$(WHITE)                   ║$(RESET) Build Embed (standard dev build)                                   $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)embed:build:cdn$(WHITE)               ║$(RESET) Build Embed for CDN (dev env, alias for embed:build:cdn:dev)       $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)embed:build:cdn:dev$(WHITE)           ║$(RESET) Build Embed for CDN with dev CDN configuration                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)embed:build:cdn:production$(WHITE)    ║$(RESET) Build Embed for CDN with production CDN configuration              $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)embed:upload$(WHITE)                  ║$(RESET) Upload Embed to R2 CDN (dev)                                       $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)embed:upload:production$(WHITE)       ║$(RESET) Upload Embed to R2 CDN (production)                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)embed:upload:dry-run$(WHITE)          ║$(RESET) Preview Embed upload (no changes)                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)embed:deploy$(WHITE)                  ║$(RESET) Build and deploy Embed (dev)                                       $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)embed:deploy:production$(WHITE)       ║$(RESET) Build and deploy Embed (production)                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)MAINTENANCE$(WHITE)                                                                                       ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)clean$(WHITE)                         ║$(RESET) Remove build outputs and caches                                   $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)clean:all$(WHITE)                     ║$(RESET) Remove deps, builds, and caches                                   $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)clean:deep$(WHITE)                    ║$(RESET) Remove all node_modules and reinstall                             $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)reset$(WHITE)                         ║$(RESET) Clean and reinstall everything                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)╚═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(YELLOW)Quick Shortcuts:$(RESET) $(CYAN)i$(RESET)=install $(CYAN)d$(RESET)=dev $(CYAN)b$(RESET)=build $(CYAN)l$(RESET)=lint $(CYAN)f$(RESET)=format $(CYAN)t$(RESET)=test $(CYAN)c$(RESET)=check"
	@echo ""

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(RESET)"
	@bun install
	@echo "$(GREEN)Dependencies installed!$(RESET)"

dev: ## Run all apps in development mode
	@echo "$(MAGENTA)Starting all apps in development mode...$(RESET)"
	@bun dev

dev\:web: ## Run web app only
	@echo "$(MAGENTA)Starting web app (Next.js)...$(RESET)"
	@cd apps/web && bun dev

dev\:astro: ## Run astro app only
	@echo "$(MAGENTA)Starting Astro app...$(RESET)"
	@cd apps/astro-app && bun dev

dev\:api: ## Run API only
	@echo "$(MAGENTA)Starting Hono API...$(RESET)"
	@cd apps/api && bun dev

dev\:share: ## Run Share URL shortener only
	@echo "$(MAGENTA)Starting Share URL shortener...$(RESET)"
	@cd apps/share && bun dev

dev\:email: ## Run Email preview server only
	@echo "$(MAGENTA)Starting Email preview server...$(RESET)"
	@cd packages/email && bun dev

dev\:playground: ## Run playground app only
	@echo "$(MAGENTA)Starting Playground app...$(RESET)"
	@cd apps/playground && bun dev

build: ## Build all apps
	@echo "$(BLUE)Building all apps...$(RESET)"
	@bun run build
	@echo "$(GREEN)Build complete!$(RESET)"

build\:web: ## Build web app only
	@echo "$(BLUE)Building web app...$(RESET)"
	@cd apps/web && bun run build
	@echo "$(GREEN)Web app built!$(RESET)"

build\:astro: ## Build astro app only
	@echo "$(BLUE)Building Astro app...$(RESET)"
	@cd apps/astro-app && bun run build
	@echo "$(GREEN)Astro app built!$(RESET)"

build\:api: ## Build API only
	@echo "$(BLUE)Building API...$(RESET)"
	@cd apps/api && bun run build
	@echo "$(GREEN)API built!$(RESET)"

build\:share: ## Build Share URL shortener only
	@echo "$(BLUE)Building Share URL shortener...$(RESET)"
	@cd apps/share && bun run build
	@echo "$(GREEN)Share URL shortener built!$(RESET)"

lint: ## Run linter
	@echo "$(YELLOW)Running linter...$(RESET)"
	@bun run lint
	@echo "$(GREEN)Linting complete!$(RESET)"

lint\:fix: ## Run linter and fix issues
	@echo "$(YELLOW)Running linter with auto-fix...$(RESET)"
	@bunx turbo lint -- --fix
	@echo "$(GREEN)Linting and fixes complete!$(RESET)"

format: ## Format all files
	@echo "$(YELLOW)Formatting code...$(RESET)"
	@bun run format
	@echo "$(GREEN)Formatting complete!$(RESET)"

format\:check: ## Check formatting
	@echo "$(YELLOW)Checking code formatting...$(RESET)"
	@bun run format:check

fmt: format ## Shortcut for format

fmt\:check: format\:check ## Shortcut for format:check

fmt\:fix: format\:fix ## Shortcut for format:fix

typecheck: ## Type check all packages
	@echo "$(BLUE)Running type check...$(RESET)"
	@bunx turbo typecheck
	@echo "$(GREEN)Type check complete!$(RESET)"

test: ## Run all tests
	@echo "$(CYAN)Running tests...$(RESET)"
	@bunx turbo test
	@echo "$(GREEN)Tests complete!$(RESET)"

test\:watch: ## Run tests in watch mode
	@echo "$(CYAN)Running tests in watch mode...$(RESET)"
	@bunx turbo test -- --watch

check: lint typecheck format\:check ## Run all checks
	@echo "$(GREEN)All checks passed!$(RESET)"

fix: lint\:fix format ## Fix all issues (lint + format)
	@echo "$(GREEN)All fixes applied!$(RESET)"

clean: ## Remove build outputs and caches
	@echo "$(YELLOW)Cleaning build outputs and caches...$(RESET)"
	@rm -rf .turbo
	@find . -name 'dist' -type d -prune -exec rm -rf '{}' +
	@find . -name '.next' -type d -prune -exec rm -rf '{}' +
	@find . -name '.astro' -type d -prune -exec rm -rf '{}' +
	@echo "$(GREEN)Clean complete!$(RESET)"

clean\:all: clean ## Remove deps, builds, and caches
	@echo "$(RED)Removing all dependencies...$(RESET)"
	@find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +
	@rm -f bun.lockb
	@echo "$(GREEN)Everything cleaned!$(RESET)"

clean\:deep: ## Remove all node_modules and reinstall
	@echo "$(YELLOW)Starting deep clean...$(RESET)"
	@echo "$(RED)Removing all node_modules directories...$(RESET)"
	@rm -rf node_modules
	@rm -rf apps/*/node_modules
	@rm -rf packages/*/node_modules
	@echo "$(BLUE)Reinstalling dependencies...$(RESET)"
	@bun install
	@echo "$(GREEN)Deep clean complete!$(RESET)"

reset: clean\:all install ## Clean and reinstall everything
	@echo "$(GREEN)Project reset complete!$(RESET)"

preview\:astro: ## Preview astro production build
	@echo "$(MAGENTA)Previewing Astro production build...$(RESET)"
	@cd apps/astro-app && bun run preview

test\:api: ## Test API endpoints
	@echo "$(CYAN)Testing API endpoints...$(RESET)"
	@cd apps/api && ./test-api.sh

storybook\:recorder: ## Run Storybook for recorder app
	@echo "$(MAGENTA)Starting Storybook for recorder...$(RESET)"
	@cd apps/recorder && bun run storybook

storybook\:recorder\:build: ## Build Storybook for recorder app
	@echo "$(BLUE)Building Storybook for recorder...$(RESET)"
	@cd apps/recorder && bun run build-storybook
	@echo "$(GREEN)Storybook build complete!$(RESET)"

storybook\:postbridge: ## Run Storybook for postbridge package
	@echo "$(MAGENTA)Starting Storybook for postbridge...$(RESET)"
	@cd packages/postbridge && bun run storybook

storybook\:postbridge\:build: ## Build Storybook for postbridge package
	@echo "$(BLUE)Building Storybook for postbridge...$(RESET)"
	@cd packages/postbridge && bun run build-storybook
	@echo "$(GREEN)Storybook build complete!$(RESET)"

# Assets commands
assets\:upload: ## Upload assets to R2 CDN (dev)
	@echo "$(BLUE)Uploading assets to R2 CDN (development)...$(RESET)"
	@if [ ! -f packages/storage/.env.development ] && [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: .env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/storage && bun run upload-assets --env=development
	@echo "$(GREEN)Assets uploaded!$(RESET)"

assets\:upload\:production: ## Upload assets to R2 CDN (production)
	@echo "$(RED)Uploading assets to R2 CDN (production)...$(RESET)"
	@echo "$(RED)WARNING: This will upload assets to PRODUCTION!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	@if [ ! -f packages/storage/.env.production ] && [ ! -f apps/api/.env.production ]; then \
		echo "$(RED)Error: .env.production not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/storage && bun run upload-assets --env=production
	@echo "$(GREEN)Assets uploaded!$(RESET)"

assets\:upload\:dry-run: ## Preview what would be uploaded to R2 CDN (dev)
	@echo "$(BLUE)Previewing asset upload (development)...$(RESET)"
	@if [ ! -f packages/storage/.env.development ] && [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: .env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/storage && bun run upload-assets --env=development --dry-run

assets\:manifest: ## Generate asset manifest only (no upload)
	@echo "$(BLUE)Generating asset manifest...$(RESET)"
	@cd packages/storage && bun run assets:manifest
	@echo "$(GREEN)Manifest generated!$(RESET)"

assets\:validate: ## Validate manifest assets exist (local + remote dev)
	@echo "$(BLUE)Validating manifest assets...$(RESET)"
	@cd packages/storage && bun run assets:validate
	@echo "$(GREEN)Validation complete!$(RESET)"

assets\:validate\:local: ## Validate local asset files exist
	@echo "$(BLUE)Validating local assets...$(RESET)"
	@cd packages/storage && bun run assets:validate:local
	@echo "$(GREEN)Local validation complete!$(RESET)"

assets\:validate\:production: ## Validate assets exist on production CDN
	@echo "$(BLUE)Validating production CDN assets...$(RESET)"
	@cd packages/storage && bun run assets:validate:production
	@echo "$(GREEN)Production validation complete!$(RESET)"

update: ## Update dependencies
	@echo "$(BLUE)Updating dependencies...$(RESET)"
	@bun update
	@echo "$(GREEN)Dependencies updated!$(RESET)"

env\:setup: ## Copy .env.example files to create .env.development files
	@echo "$(BLUE)Setting up environment files...$(RESET)"
	@if [ ! -f apps/api/.env.development ]; then cp apps/api/.env.example apps/api/.env.development && echo "$(GREEN)✓$(RESET) Created apps/api/.env.development"; else echo "$(YELLOW)⚠$(RESET) apps/api/.env.development already exists"; fi
	@if [ ! -f apps/dash/.env.development ]; then cp apps/dash/.env.example apps/dash/.env.development && echo "$(GREEN)✓$(RESET) Created apps/dash/.env.development"; else echo "$(YELLOW)⚠$(RESET) apps/dash/.env.development already exists"; fi
	@if [ ! -f apps/home/.env.development ]; then cp apps/home/.env.example apps/home/.env.development && echo "$(GREEN)✓$(RESET) Created apps/home/.env.development"; else echo "$(YELLOW)⚠$(RESET) apps/home/.env.development already exists"; fi
	@if [ ! -f apps/recorder/.env.development ]; then cp apps/recorder/.env.example apps/recorder/.env.development && echo "$(GREEN)✓$(RESET) Created apps/recorder/.env.development"; else echo "$(YELLOW)⚠$(RESET) apps/recorder/.env.development already exists"; fi
	@if [ ! -f packages/storage/.env.development ]; then cp packages/storage/.env.example packages/storage/.env.development && echo "$(GREEN)✓$(RESET) Created packages/storage/.env.development"; else echo "$(YELLOW)⚠$(RESET) packages/storage/.env.development already exists"; fi
	@echo "$(GREEN)Environment files setup complete!$(RESET)"
	@echo "$(YELLOW)Remember to update the values in each .env.development file$(RESET)"

env\:check: ## Check if .env.development files exist
	@echo "$(BLUE)Checking environment files...$(RESET)"
	@if [ -f apps/api/.env.development ]; then echo "$(GREEN)✓$(RESET) apps/api/.env.development exists"; else echo "$(RED)✗$(RESET) apps/api/.env.development missing"; fi
	@if [ -f apps/dash/.env.development ]; then echo "$(GREEN)✓$(RESET) apps/dash/.env.development exists"; else echo "$(RED)✗$(RESET) apps/dash/.env.development missing"; fi
	@if [ -f apps/home/.env.development ]; then echo "$(GREEN)✓$(RESET) apps/home/.env.development exists"; else echo "$(RED)✗$(RESET) apps/home/.env.development missing"; fi
	@if [ -f apps/recorder/.env.development ]; then echo "$(GREEN)✓$(RESET) apps/recorder/.env.development exists"; else echo "$(RED)✗$(RESET) apps/recorder/.env.development missing"; fi
	@if [ -f packages/storage/.env.development ]; then echo "$(GREEN)✓$(RESET) packages/storage/.env.development exists"; else echo "$(RED)✗$(RESET) packages/storage/.env.development missing (optional, falls back to apps/api)"; fi

# Database commands - Development
db\:generate: ## Generate Drizzle migrations (dev)
	@echo "$(BLUE)Generating Drizzle migrations (development)...$(RESET)"
	@if [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: apps/api/.env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && set -a && . ../../apps/api/.env.development && set +a && bun run db:generate
	@echo "$(GREEN)Migrations generated!$(RESET)"

db\:migrate: ## Run database migrations (dev)
	@echo "$(BLUE)Running database migrations (development)...$(RESET)"
	@if [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: apps/api/.env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && set -a && . ../../apps/api/.env.development && set +a && bun run db:migrate
	@echo "$(GREEN)Migrations complete!$(RESET)"

db\:push: ## Push schema directly to DB (dev)
	@echo "$(YELLOW)Pushing schema to database (development)...$(RESET)"
	@if [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: apps/api/.env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && set -a && . ../../apps/api/.env.development && set +a && bun run db:push
	@echo "$(GREEN)Schema pushed!$(RESET)"

db\:studio: ## Open Drizzle Studio (dev)
	@echo "$(MAGENTA)Opening Drizzle Studio (development)...$(RESET)"
	@if [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: apps/api/.env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && set -a && . ../../apps/api/.env.development && set +a && bun run db:studio

# Database commands - Production
db\:generate\:production: ## Generate Drizzle migrations (production)
	@echo "$(BLUE)Generating Drizzle migrations (production)...$(RESET)"
	@if [ ! -f apps/api/.env.production ]; then \
		echo "$(RED)Error: apps/api/.env.production not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && set -a && . ../../apps/api/.env.production && set +a && bun run db:generate
	@echo "$(GREEN)Migrations generated!$(RESET)"

db\:migrate\:production: ## Run database migrations (production)
	@echo "$(BLUE)Running database migrations (production)...$(RESET)"
	@if [ ! -f apps/api/.env.production ]; then \
		echo "$(RED)Error: apps/api/.env.production not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && set -a && . ../../apps/api/.env.production && set +a && bun run db:migrate
	@echo "$(GREEN)Migrations complete!$(RESET)"

db\:push\:production: ## Push schema directly to DB (production)
	@echo "$(RED)Pushing schema to database (production)...$(RESET)"
	@echo "$(RED)WARNING: This will push schema directly to PRODUCTION database!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	@if [ ! -f apps/api/.env.production ]; then \
		echo "$(RED)Error: apps/api/.env.production not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && set -a && . ../../apps/api/.env.production && set +a && bun run db:push
	@echo "$(GREEN)Schema pushed!$(RESET)"

db\:studio\:production: ## Open Drizzle Studio (production)
	@echo "$(MAGENTA)Opening Drizzle Studio (production)...$(RESET)"
	@if [ ! -f apps/api/.env.production ]; then \
		echo "$(RED)Error: apps/api/.env.production not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && set -a && . ../../apps/api/.env.production && set +a && bun run db:studio

# Inngest commands
inngest\:dev: ## Run Inngest dev server (localhost:8288)
	@echo "$(MAGENTA)Starting Inngest dev server...$(RESET)"
	@npx inngest-cli@latest dev

# Tunnel commands (Cloudflare Tunnel)
# Config file location
TUNNEL_CONFIG := .cloudflared/config.yml
TUNNEL_PID_FILE := .cloudflared/tunnel.pid
TUNNEL_LOG_FILE := .cloudflared/tunnel.log

tunnel\:start: ## Start Cloudflare tunnel (all services)
	@echo "$(MAGENTA)Starting Cloudflare tunnel...$(RESET)"
	@if ! command -v cloudflared >/dev/null 2>&1; then \
		echo "$(RED)Error: cloudflared is not installed$(RESET)"; \
		echo "$(YELLOW)Install with: brew install cloudflared$(RESET)"; \
		exit 1; \
	fi
	@if [ ! -f $(TUNNEL_CONFIG) ]; then \
		echo "$(RED)Error: $(TUNNEL_CONFIG) not found$(RESET)"; \
		exit 1; \
	fi
	@# Check if tunnel is already running
	@if [ -f $(TUNNEL_PID_FILE) ] && kill -0 $$(cat $(TUNNEL_PID_FILE)) 2>/dev/null; then \
		echo "$(YELLOW)Tunnel is already running (PID: $$(cat $(TUNNEL_PID_FILE)))$(RESET)"; \
		exit 0; \
	fi
	@# Start cloudflared in background
	@cloudflared tunnel --config $(TUNNEL_CONFIG) run > $(TUNNEL_LOG_FILE) 2>&1 & echo $$! > $(TUNNEL_PID_FILE)
	@echo "$(YELLOW)Waiting for tunnel to establish...$(RESET)"
	@sleep 3
	@if kill -0 $$(cat $(TUNNEL_PID_FILE)) 2>/dev/null; then \
		echo ""; \
		echo "$(GREEN)Cloudflare tunnel started!$(RESET)"; \
		echo ""; \
		echo "$(CYAN)Tunnel URLs:$(RESET)"; \
		echo "$(WHITE)-------------------------------------------$(RESET)"; \
		echo "$(GREEN)API:$(RESET)        https://api-dev.userplane.io"; \
		echo "$(GREEN)Dash:$(RESET)       https://dash-dev.userplane.io"; \
		echo "$(GREEN)Home:$(RESET)       https://home-dev.userplane.io"; \
		echo "$(GREEN)Recorder:$(RESET)   https://recorder-dev.userplane.io"; \
		echo "$(GREEN)Playground:$(RESET) https://playground-dev.userplane.io"; \
		echo "$(WHITE)-------------------------------------------$(RESET)"; \
		echo ""; \
		echo "$(YELLOW)Run 'make tunnel:stop' to stop the tunnel$(RESET)"; \
	else \
		echo "$(RED)Failed to start tunnel. Check $(TUNNEL_LOG_FILE) for details$(RESET)"; \
		exit 1; \
	fi

tunnel\:stop: ## Stop Cloudflare tunnel
	@echo "$(YELLOW)Stopping Cloudflare tunnel...$(RESET)"
	@if [ -f $(TUNNEL_PID_FILE) ]; then \
		pid=$$(cat $(TUNNEL_PID_FILE)); \
		if kill -0 "$$pid" 2>/dev/null; then \
			kill "$$pid" 2>/dev/null || true; \
			echo "$(GREEN)Stopped tunnel (PID: $$pid)$(RESET)"; \
		else \
			echo "$(YELLOW)Tunnel was not running$(RESET)"; \
		fi; \
		rm -f $(TUNNEL_PID_FILE); \
	else \
		echo "$(YELLOW)No tunnel PID file found$(RESET)"; \
	fi
	@# Also kill any orphaned cloudflared processes
	@pkill -f "cloudflared tunnel.*run" 2>/dev/null || true
	@echo "$(GREEN)Tunnel stopped!$(RESET)"

tunnel\:status: ## Show tunnel status and URLs
	@echo "$(CYAN)Cloudflare Tunnel Status$(RESET)"
	@echo "$(WHITE)-------------------------------------------$(RESET)"
	@if [ -f $(TUNNEL_PID_FILE) ] && kill -0 $$(cat $(TUNNEL_PID_FILE)) 2>/dev/null; then \
		echo "$(GREEN)Status:$(RESET)   Running (PID: $$(cat $(TUNNEL_PID_FILE)))"; \
	else \
		echo "$(RED)Status:$(RESET)   Not running"; \
	fi
	@echo "$(WHITE)-------------------------------------------$(RESET)"
	@echo "$(CYAN)Configured URLs:$(RESET)"
	@echo "$(GREEN)API:$(RESET)        https://api-dev.userplane.io"
	@echo "$(GREEN)Dash:$(RESET)       https://dash-dev.userplane.io"
	@echo "$(GREEN)Home:$(RESET)       https://home-dev.userplane.io"
	@echo "$(GREEN)Recorder:$(RESET)   https://recorder-dev.userplane.io"
	@echo "$(GREEN)Playground:$(RESET) https://playground-dev.userplane.io"
	@echo "$(WHITE)-------------------------------------------$(RESET)"

# SDK Package commands
sdk\:build: ## Build SDK (standard dev build)
	@$(MAKE) metadata:build
	@echo "$(BLUE)Building SDK...$(RESET)"
	@cd packages/sdk && bun run build
	@echo "$(GREEN)SDK built!$(RESET)"

sdk\:build\:npm: ## Build SDK (size-optimized for npm)
	@$(MAKE) metadata:build:npm
	@echo "$(BLUE)Building SDK (npm optimized)...$(RESET)"
	@cd packages/sdk && bun run build:npm
	@echo "$(GREEN)SDK built (npm optimized)!$(RESET)"

sdk\:build\:cdn: ## Build SDK (size-optimized for CDN)
	@$(MAKE) metadata:build:cdn
	@echo "$(BLUE)Building SDK (CDN optimized)...$(RESET)"
	@cd packages/sdk && bun run build:cdn
	@echo "$(GREEN)SDK built (CDN optimized)!$(RESET)"

sdk\:build\:npm\:obfuscate: ## Build SDK (obfuscated for npm)
	@$(MAKE) metadata:build:npm
	@echo "$(BLUE)Building SDK (npm obfuscated)...$(RESET)"
	@cd packages/sdk && bun run build:npm:obfuscate
	@echo "$(GREEN)SDK built (npm obfuscated)!$(RESET)"

sdk\:build\:cdn\:obfuscate: ## Build SDK (obfuscated for CDN)
	@$(MAKE) metadata:build:cdn
	@echo "$(BLUE)Building SDK (CDN obfuscated)...$(RESET)"
	@cd packages/sdk && bun run build:cdn:obfuscate
	@echo "$(GREEN)SDK built (CDN obfuscated)!$(RESET)"

# Metadata Package commands
metadata\:build: ## Build Metadata (standard dev build)
	@echo "$(BLUE)Building Metadata...$(RESET)"
	@cd packages/metadata && bun run build
	@echo "$(GREEN)Metadata built!$(RESET)"

metadata\:build\:npm: ## Build Metadata (size-optimized for npm)
	@echo "$(BLUE)Building Metadata (npm optimized)...$(RESET)"
	@cd packages/metadata && bun run build:npm
	@echo "$(GREEN)Metadata built (npm optimized)!$(RESET)"

metadata\:build\:cdn: ## Build Metadata (size-optimized for CDN)
	@echo "$(BLUE)Building Metadata (CDN optimized)...$(RESET)"
	@cd packages/metadata && bun run build:cdn
	@echo "$(GREEN)Metadata built (CDN optimized)!$(RESET)"

# Embed Package commands
embed\:build: ## Build Embed (standard dev build)
	@$(MAKE) sdk:build
	@echo "$(BLUE)Building Embed...$(RESET)"
	@cd packages/embed && bun run build
	@echo "$(GREEN)Embed built!$(RESET)"

# Helper function to extract CDN_DOMAIN from .env file
# Usage: $(call get_cdn_domain,environment)
define get_cdn_domain
$(shell \
	if [ -f packages/embed/.env.$(1) ]; then \
		grep '^CDN_DOMAIN' packages/embed/.env.$(1) 2>/dev/null | cut -d'=' -f2 | tr -d "'" | tr -d '"'; \
	elif [ -f apps/api/.env.$(1) ]; then \
		grep '^CDN_DOMAIN' apps/api/.env.$(1) 2>/dev/null | cut -d'=' -f2 | tr -d "'" | tr -d '"'; \
	fi \
)
endef

# Helper function to extract R2_CDN_PREFIX from .env file
# Usage: $(call get_cdn_prefix,environment)
define get_cdn_prefix
$(shell \
	if [ -f packages/embed/.env.$(1) ]; then \
		grep '^R2_CDN_PREFIX' packages/embed/.env.$(1) 2>/dev/null | cut -d'=' -f2 | tr -d "'" | tr -d '"'; \
	elif [ -f apps/api/.env.$(1) ]; then \
		grep '^R2_CDN_PREFIX' apps/api/.env.$(1) 2>/dev/null | cut -d'=' -f2 | tr -d "'" | tr -d '"'; \
	fi \
)
endef

embed\:build\:cdn: embed\:build\:cdn\:dev ## Build Embed for CDN (alias for embed:build:cdn:dev)

embed\:build\:cdn\:dev: ## Build Embed for CDN with dev CDN configuration
	@if [ ! -f packages/embed/.env.development ] && [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: .env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@$(MAKE) sdk:build:cdn
	@echo "$(BLUE)Building Embed (CDN) for development...$(RESET)"
	$(eval CDN_DOMAIN_VAL := $(call get_cdn_domain,development))
	$(eval CDN_PREFIX_VAL := $(call get_cdn_prefix,development))
	@if [ -z "$(CDN_DOMAIN_VAL)" ]; then \
		echo "$(RED)Error: CDN_DOMAIN not found in .env.development$(RESET)"; \
		exit 1; \
	fi
	@echo "$(CYAN)Using CDN URL: $(CDN_DOMAIN_VAL)/$(or $(CDN_PREFIX_VAL),embed)$(RESET)"
	@cd packages/embed && CDN_DOMAIN="$(CDN_DOMAIN_VAL)" R2_CDN_PREFIX="$(or $(CDN_PREFIX_VAL),embed)" bun run build:cdn
	@echo "$(GREEN)Embed built (CDN) for development!$(RESET)"

embed\:build\:cdn\:production: ## Build Embed for CDN with production CDN configuration
	@if [ ! -f packages/embed/.env.production ] && [ ! -f apps/api/.env.production ]; then \
		echo "$(RED)Error: .env.production not found$(RESET)"; \
		exit 1; \
	fi
	@$(MAKE) sdk:build:cdn
	@echo "$(BLUE)Building Embed (CDN) for production...$(RESET)"
	$(eval CDN_DOMAIN_VAL := $(call get_cdn_domain,production))
	$(eval CDN_PREFIX_VAL := $(call get_cdn_prefix,production))
	@if [ -z "$(CDN_DOMAIN_VAL)" ]; then \
		echo "$(RED)Error: CDN_DOMAIN not found in .env.production$(RESET)"; \
		exit 1; \
	fi
	@echo "$(CYAN)Using CDN URL: $(CDN_DOMAIN_VAL)/$(or $(CDN_PREFIX_VAL),embed)$(RESET)"
	@cd packages/embed && CDN_DOMAIN="$(CDN_DOMAIN_VAL)" R2_CDN_PREFIX="$(or $(CDN_PREFIX_VAL),embed)" bun run build:cdn
	@echo "$(GREEN)Embed built (CDN) for production!$(RESET)"

embed\:upload: ## Upload Embed to R2 CDN (dev)
	@echo "$(BLUE)Uploading Embed to R2 CDN (development)...$(RESET)"
	@if [ ! -f packages/embed/.env.development ] && [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: .env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/embed && bun run upload:cdn --env=development
	@echo "$(GREEN)Embed uploaded!$(RESET)"

embed\:upload\:production: ## Upload Embed to R2 CDN (production)
	@echo "$(RED)Uploading Embed to R2 CDN (production)...$(RESET)"
	@echo "$(RED)WARNING: This will upload Embed to PRODUCTION CDN!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	@if [ ! -f packages/embed/.env.production ] && [ ! -f apps/api/.env.production ]; then \
		echo "$(RED)Error: .env.production not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/embed && bun run upload:cdn --env=production
	@echo "$(GREEN)Embed uploaded!$(RESET)"

embed\:upload\:dry-run: ## Preview Embed upload (no changes)
	@echo "$(BLUE)Previewing Embed upload (development)...$(RESET)"
	@if [ ! -f packages/embed/.env.development ] && [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: .env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/embed && bun run upload:cdn --env=development --dry-run

embed\:deploy: ## Build and deploy Embed (dev)
	@$(MAKE) embed:build:cdn:dev
	@echo "$(BLUE)Deploying Embed (development)...$(RESET)"
	@cd packages/embed && bun run upload:cdn --env=development
	@echo "$(GREEN)Embed deployed!$(RESET)"

embed\:deploy\:production: ## Build and deploy Embed (production)
	@$(MAKE) embed:build:cdn:production
	@echo "$(RED)Deploying Embed (production)...$(RESET)"
	@echo "$(RED)WARNING: This will deploy Embed to PRODUCTION CDN!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	@cd packages/embed && bun run upload:cdn --env=production
	@echo "$(GREEN)Embed deployed!$(RESET)"

i: install ## Shortcut for install
d: dev ## Shortcut for dev
b: build ## Shortcut for build
l: lint ## Shortcut for lint
f: format ## Shortcut for format
t: test ## Shortcut for test
c: check ## Shortcut for check

