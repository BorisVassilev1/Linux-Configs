"call plug#begin()

"Plug 'lambdalisue/suda.vim' 
"Plug 'norcalli/nvim-colorizer.lua'

"Plug 'neoclide/coc.nvim', {'branch': 'release'}
"Plug 'neoclide/coc.nvim', {'do': { -> coc#util#install()}}

"Plug 'preservim/nerdtree'

"call plug#end()

set smartindent
set tabstop=4
set shiftwidth=4
set noexpandtab

colorscheme default

"source ~/.config/nvim/settings/coc_settings.vim

"nnoremap <leader>n :NERDTreeFocus<CR>
"nnoremap <C-n> :NERDTree<CR>
"nnoremap <C-t> :NERDTreeToggle<CR>
"nnoremap <C-f> :NERDTreeFind<CR>



" turn hybrid line numbers on
set number relativenumber
set nu rnu

" Set scripts to be executable from the shell
au BufWritePost * if getline(1) =~ "^#!" | if getline(1) =~ "/bin/" | silent !chmod +x <afile> | endif | endif

setlocal cindent cino=j1,(0,ws,Ws

set wrap
set linebreak
set showbreak=>\ \ \ 

