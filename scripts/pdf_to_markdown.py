import PyPDF2
import re
import sys

def pdf_to_markdown(pdf_path, output_path=None):
    """Convert PDF to Markdown format."""
    if output_path is None:
        output_path = pdf_path.rsplit('.', 1)[0] + '.md'
    
    # Open the PDF file
    with open(pdf_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        text = ""
        
        # Extract text from each page
        for page in reader.pages:
            text += page.extract_text() + "\n\n"
    
    # Basic formatting for headers and lists
    text = re.sub(r'\n(\d+\.\s+.*?)(?=\n\d+\.|\Z)', r'\n## \1', text, flags=re.DOTALL)
    text = re.sub(r'\n([A-Z][A-Za-z0-9 ]+?)(?:\n|$)', r'\n### \1\n', text)
    
    # Write to markdown file
    with open(output_path, 'w', encoding='utf-8') as md_file:
        md_file.write(f"# {pdf_path.rsplit('/')[-1].rsplit('.', 1)[0]}\n\n")
        md_file.write(text)
    
    return output_path

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python pdf_to_markdown.py <path_to_pdf> [output_path]")
        sys.exit(1)
        
    pdf_path = sys.argv[1]
    output_path = sys.argv[2] if len(sys.argv) > 2 else None
    
    try:
        result = pdf_to_markdown(pdf_path, output_path)
        print(f"Successfully converted to Markdown: {result}")
    except Exception as e:
        print(f"Error converting PDF: {e}")
        sys.exit(1)
